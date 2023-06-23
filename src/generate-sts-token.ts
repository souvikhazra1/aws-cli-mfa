import { IAM } from "@aws-sdk/client-iam";
import { STS } from "@aws-sdk/client-sts";
import { question } from "readline-sync";

const generateStsToken = async (credentials: any) => {
    const iam = new IAM({
        credentials
    });
    const devices = await iam.listMFADevices({
        UserName: process.env.CURRENT_AWS_USER
    });
    console.log('MFA Devices');
    devices.MFADevices.forEach((device, idx) => {
        console.log(`${idx + 1}. ${device.SerialNumber.split('/')[1]}`);
    });

    const deviceIdx = parseInt(question('Choice: '));
    if (deviceIdx == 0 || deviceIdx > devices.MFADevices.length) {
        console.log('[E] Invalid device selected');
        return;
    }
    const otp = question('Enter Code: ');

    const sts = new STS({
        credentials,
    });
    const stsToken = await sts.getSessionToken({
        DurationSeconds: 28800,
        SerialNumber: devices.MFADevices[deviceIdx - 1].SerialNumber,
        TokenCode: otp
    });
    console.log('\nSTS Token:');
    console.log(stsToken.Credentials);
    console.log('\nAdd the following in your aws credential file, keep the original credentials backed up, those will be required to regenerate the token once it expired.');
    console.log(`
aws_access_key_id = ${stsToken.Credentials.AccessKeyId}
aws_secret_access_key = ${stsToken.Credentials.SecretAccessKey}
aws_session_token = ${stsToken.Credentials.SessionToken}
    `);
};

export default generateStsToken;