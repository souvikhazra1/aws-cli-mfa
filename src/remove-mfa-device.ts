import { IAM } from "@aws-sdk/client-iam";
import { question } from "readline-sync";

const removeMfaDevice = async (credentials: any) => {
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

    await iam.deactivateMFADevice({
        SerialNumber: devices.MFADevices[deviceIdx - 1].SerialNumber,
        UserName: process.env.CURRENT_AWS_USER
    });
    await iam.deleteVirtualMFADevice({
        SerialNumber: devices.MFADevices[deviceIdx - 1].SerialNumber,
    });
};

export default removeMfaDevice;