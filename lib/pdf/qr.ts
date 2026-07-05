import QRCode from "qrcode";

const PT_PER_INCH = 72;
const QR_PRINT_DPI = 300;
const QR_DARK = "#162827";
const QR_LIGHT = "#B1D356";

export async function generateQrPng(url: string, sizePt: number): Promise<Buffer> {
  const pixelSize = Math.round((sizePt / PT_PER_INCH) * QR_PRINT_DPI);

  return QRCode.toBuffer(url, {
    type: "png",
    margin: 0,
    width: pixelSize,
    color: {
      dark: QR_DARK,
      light: QR_LIGHT,
    },
    errorCorrectionLevel: "M",
  });
}
