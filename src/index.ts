import { GetCallerIdentityCommandOutput, STS } from "@aws-sdk/client-sts";
import { fromIni } from "@aws-sdk/credential-providers";
import { question } from "readline-sync";
import enrollMfa from "./enroll-mfa";
import generateStsToken from "./generate-sts-token";
import removeMfaDevice from "./remove-mfa-device";

if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = 'us-east-1';
}

let profile = '';
for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--profile') {
        profile = process.argv[i + 1];
        break;
    }
}
let credentials: any;
if (profile) {
    credentials = fromIni({
        profile
    });
}

if (!credentials) {
    const accessKeyId = question('Access Key ID: ', { hideEchoBack: true });
    const secretAccessKey = question('Secret Access Key: ', { hideEchoBack: true });

    if (!accessKeyId || !secretAccessKey) {
        console.log('\n[E] Missing credentials');
        process.exit();
    }

    credentials = {
        accessKeyId,
        secretAccessKey
    };
}

(async () => {
    const sts = new STS({
        credentials
    });
    let resp: GetCallerIdentityCommandOutput;
    try {
        resp = await sts.getCallerIdentity({});
        if (!resp.Account) {
            throw '';
        }
        console.log('User ID: ', resp.UserId);
        console.log('Account: ', resp.Account);
        console.log('ARN: ', resp.Arn);
    } catch (e) {
        console.log();
        console.log(e);
        console.log('\n[E] Invalid credentials');
        return;
    }
    process.env.CURRENT_AWS_USER = resp.Arn.split('/')[1];

    try {
        console.log('\n1. Enroll MFA');
        console.log('2. Generate STS Token');
        console.log('3. Remove MFA Virtual Device');
        const choice = question('Choice: ');
        console.log();
        switch (choice) {
            case '1':
                await enrollMfa(credentials);
                break;
            case '2':
                await generateStsToken(credentials);
                break;
            case '3':
                await removeMfaDevice(credentials);
                break;
            default:
                console.log('[E] Invalid Choice');
                break;
        }
    } catch (e) {
        console.log(e);
    }
})();