import { connection } from "next/server";

export default function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicContent>{children}</PublicContent>;
}

async function PublicContent({ children }: { children: React.ReactNode }) {
  await connection();
  return <main>{children}</main>;
}
