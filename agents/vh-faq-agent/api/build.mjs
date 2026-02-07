import { build } from "esbuild";
import {
  readdir,
  stat,
  copyFile,
  mkdir,
  rm,
  writeFile,
  readFile,
} from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function copyDirectory(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const entryStat = await stat(srcPath);

    if (entryStat.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function createProductionPackageJson() {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  const productionPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    main: "index.mjs",
  };

  await writeFile(
    "dist/package.json",
    JSON.stringify(productionPackageJson, null, 2)
  );
}

async function buildFunction() {
  console.log("🧹 Cleaning dist directory...");
  try {
    await rm("dist", { recursive: true, force: true });
  } catch (error) {
    // Directory doesn't exist, that's fine
  }

  console.log("📦 Building optimized bundle...");

  await build({
    entryPoints: ["index.mjs"],
    bundle: true,
    minify: true,
    platform: "node",
    target: "node18",
    format: "esm",
    outfile: "dist/index.mjs",
    external: [
      "@aws-sdk/client-dynamodb",
      "@aws-sdk/client-s3",
      "@aws-sdk/util-dynamodb",
    ],
    banner: {
      js: "// Optimized Lambda function bundle",
    },
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    treeShaking: true,
    sourcemap: false,
    metafile: true,
  }).then((result) => {
    if (result.metafile) {
      console.log("📊 Bundle analysis:");
      const outputs = Object.keys(result.metafile.outputs);
      outputs.forEach((output) => {
        const size = result.metafile.outputs[output].bytes;
        console.log(`   ${output}: ${(size / 1024).toFixed(2)} KB`);
      });
    }
  });

  console.log("📋 Creating production package.json...");
  await createProductionPackageJson();

  console.log("✅ Build completed successfully!");
  console.log("📁 Optimized files are in the dist/ directory");
}

buildFunction().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
