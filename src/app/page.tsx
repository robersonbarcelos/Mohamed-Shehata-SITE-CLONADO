import fs from "node:fs";
import path from "node:path";
import SiteScripts from "./site-scripts";

export default function Home() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "src/app/site-body.html"),
    "utf8"
  );
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
      <SiteScripts />
    </>
  );
}
