"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export function MiniaturaImagen({ src, alt = "", tamano = 44 }: { src: string | null; alt?: string; tamano?: number }) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  return <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground"
    style={{ width: tamano, height: tamano }}>
    {src && src !== errorSrc
      ? <Image src={src} alt={alt} width={tamano} height={tamano} unoptimized className="size-full object-cover"
          onError={() => setErrorSrc(src)} />
      : <ImageIcon className="size-4" aria-hidden="true" />}
  </span>;
}
