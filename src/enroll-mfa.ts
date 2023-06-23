import { IAM } from "@aws-sdk/client-iam";
import fs from "fs";
import Jimp from "jimp";
import jsQR from "jsqr";
import os from "os";
import path from "path";
import qrGenerator from 'qrcode-terminal';
import { question } from "readline-sync";

const enrollMfa = async (credentials: any) => {
    const deviceName = question('Device Name: ');
    if (deviceName) {
        const iam = new IAM({
            credentials
        });
        const resp = await iam.createVirtualMFADevice({
            VirtualMFADeviceName: deviceName
        });
        if (!resp.VirtualMFADevice) {
            throw '[E] Failed to create MFA device';
        }

        try {
            const img = await Jimp.read(Buffer.from(resp.VirtualMFADevice.QRCodePNG));
            const qrData = jsQR(img.bitmap.data as never, img.bitmap.width, img.bitmap.height);
            console.log();
            qrGenerator.generate(qrData.data, { small: true });
            console.log();
        } catch {
            console.log('[E] Failed to display the QR in CLI, saving as an image....');
            // save the qr to file
            const qrFile = path.join(os.tmpdir(), 'aws-mfa-qr.png');
            fs.writeFileSync(qrFile, Buffer.from(resp.VirtualMFADevice.QRCodePNG));
            console.log('QR File: ', qrFile);
        }

        const code1 = question('Code 1: ');
        const code2 = question('Code 2: ');
        try {
            await iam.enableMFADevice({
                SerialNumber: resp.VirtualMFADevice.SerialNumber,
                UserName: process.env.CURRENT_AWS_USER,
                AuthenticationCode1: code1,
                AuthenticationCode2: code2
            });
        } catch (e) {
            console.log(e);
            console.log('Failed to enable MFA device, deleting....');
            await iam.deleteVirtualMFADevice({
                SerialNumber: resp.VirtualMFADevice.SerialNumber
            });
        }
    }
};

export default enrollMfa;