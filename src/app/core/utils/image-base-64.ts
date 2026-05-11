export function getImageFromBase64 (base64: string): string {
    return `data:image/jpeg;base64,${base64}`;
}