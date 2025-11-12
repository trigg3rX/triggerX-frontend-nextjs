"use client";

/**
 * Uploads raw text content to Pinata and returns an ipfs://CID URL.
 * Requires JWT in env: NEXT_PUBLIC_PINATA_JWT
 */
export async function uploadTextToPinata(
  content: string,
  filename = "script.go",
): Promise<string> {
  const token = process.env.NEXT_PUBLIC_PINATA_JWT;
  if (!token) {
    throw new Error("Missing NEXT_PUBLIC_PINATA_JWT");
  }

  const file = new File([content], filename, { type: "text/plain" });
  const form = new FormData();
  form.append("file", file);
  form.append("pinataMetadata", JSON.stringify({ name: filename }));
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Pinata upload failed (${res.status})${text ? `: ${text}` : ""}`,
    );
  }
  const data = (await res.json()) as { IpfsHash?: string };
  if (!data.IpfsHash) {
    throw new Error("Pinata did not return a CID");
  }
  return `https://ipfs.io/ipfs/${data.IpfsHash}`;
}
