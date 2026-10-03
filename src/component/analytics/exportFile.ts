import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const MIME = {
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// Web downloads the file; the app saves it and opens the share sheet.
export async function saveExport(blob: Blob, fileName: string, format: "csv" | "xlsx") {
  if (Platform.OS === "web") {
    const url = window.URL.createObjectURL(new Blob([blob], { type: MIME[format] }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const file = new File(Paths.document, fileName);
  await file.write(base64, { encoding: "base64" });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType: MIME[format], dialogTitle: "Analytics export" });
}
