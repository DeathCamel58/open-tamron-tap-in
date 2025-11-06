import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { finished } from "stream/promises";
import * as xml2js from "xml2js";
import * as child_process from "node:child_process";

const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../public");

/* ------------------ Configuration ------------------ */

// These can be found at: https://www.tamron.com/global/consumer/support/download/firmware/
const tapinLensNames = [
  // APS-C format DSLR (Di II)
  'B016',
  'B023',
  'B028',

  // Full-frame format DSLR (Di)
  'A009',
  'A010',
  'A011',
  'A012',
  'A022',
  'A025',
  'A030',
  'A032',
  'A034',
  'A035',
  'A037',
  'A041',
  'F004',
  'F012',
  'F013',
  'F016',
  'F017',
  'F045',
];

const lensUtilityLensNames = [
  // Full Frame Mirrorless Interchangeable (Di III)
  // NOTE: These may not even use the TAP-in console
  'A036',
  'A046',
  'A047',
  'A056',
  'A057',
  'A058',
  'A062',
  'A063',
  'A065',
  'A067',
  'A068',
  'A071',
  'F050',
  'F051',
  'F053',

  // Mirrorless Interchangeable (Di III-A)
  // NOTE: These may not even use the TAP-in console
  'B011',
  'B061',
  'B070',
  'C001',
]

const tapinMounts = [
  "E0",
  "N0",
  "S0",
];

const lensUtilityMounts = [
  "SE",
  "RF",
  "Z",
  "X",
]

const firwareMax = {
  major: 0,
  minor: 0,
}

// URL template — use placeholders {lens} and {mount}
const urls = {
  tapinXml: {
    variables: [
      'lens',
      'mount',
    ],
    path: "https://tamron.cdngc.net/tapin/lens/lensinfo_{lens}{mount}.xml",
    dir: path.join(__dirname, "tapin/lens"),
  },
  tapinLensImage: {
    variables: [
      'lens',
      'mount',
    ],
    // https://tamron.cdngc.net/tapin/lens/lensimage_F013N0.png
    path: "https://tamron.cdngc.net/tapin/lens/lensimage_{lens}{mount}.png",
    dir: path.join(__dirname, "tapin/lens"),
  },
  tapinFocusAdjustment: {
    variables: [
      'lens',
      'mount',
    ],
    // https://tamron.cdngc.net/tapin/lens/focusadjustment_F013.png
    path: "https://tamron.cdngc.net/tapin/lens/focusadjustment_{lens}.png",
    dir: path.join(__dirname, "tapin/lens"),
  },
  tapinFocusLimit: {
    variables: [
      'lens',
      'mount',
    ],
    // https://tamron.cdngc.net/tapin/lens/focuslimit_F013.png
    path: "https://tamron.cdngc.net/tapin/lens/focuslimit_{lens}.png",
    dir: path.join(__dirname, "tapin/lens"),
  },
  tapinLensFirmware: {
    variables: [
      'lens',
      'mount',
      'major',
      'minor',
    ],
    // https://tamron.cdngc.net/tapin/lens/F013N0_0301.tfwf
    path: 'https://tamron.cdngc.net/tapin/lens/{lens}{mount}_{major}{minor}.tfwf',
    dir: path.join(__dirname, "tapin/lens"),
  },
  tapinAdapterFirmware: {
    variables: [
      'major',
      'minor',
    ],
    // https://tamron.cdngc.net/tapin/adapter/AY042_0300.tfwf
    path: 'https://tamron.cdngc.net/tapin/adapter/AY042_{major}{minor}.tfwf',
    dir: path.join(__dirname, "tapin/adapter"),
  },
  lensUtilityXml: {
    variables: [
      'lens',
      'mount',
    ],
    // https://tamron.cdngc.net/tapin/lens/focuslimit_F013.png
    path: 'http://tamron.cdngc.net/lensutility/lens/{lens}{mount}.xml',
    dir: path.join(__dirname, "tapin/lens"),
  },
  lensUtilityFirmware: {
    variables: [
      'lens',
      'mount',
      'major',
      'minor',
    ],
    // https://tamron.cdngc.net/tapin/lens/focuslimit_F013.png
    path: 'http://tamron.cdngc.net/lensutility/lens/{lens}{mount}_{major}{minor}.tfwf',
    dir: path.join(__dirname, "tapin/lens"),
  },
}

const staticUrls = {
  tapinInfo: {
    name: "tapininfo.xml",
    path: "https://tamron.cdngc.net/tapin/adapter/tapininfo.xml",
    dir: path.join(__dirname, "tapin/adapter"),
  },
  lensUtilityInfoWin: {
    name: "LensUtilityInfoWin.xml",
    path: "http://tamron.cdngc.net/lensutility/utility/LensUtilityInfoWin.xml",
    dir: path.join(__dirname, "lensutility/utility"),
  },
}

for (const [key, value] of Object.entries(urls)) {
  if (fs.existsSync(value.dir)) {
    fs.rmSync(value.dir, { recursive: true });
  }
}

const CONCURRENCY = 6;

/* ------------------ Helpers ------------------ */

function sanitizeFileName(name: string) {
  // Basic sanitize: remove characters disallowed in filenames, trim, replace spaces with underscores
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim().replace(/\s+/g, "_");
}

function buildUrl(template: { variables: string[], path: string }, variables: string[]) {
  if (template.variables.length !== variables.length) {
    console.error('Variables don\'t match the template!');
  }

  let uri = template.path;

  for (let i = 0; i < template.variables.length; i++) {
    const encodedVariable = encodeURI(variables[i]);
    uri = uri.replace(`{${template.variables[i]}}`, encodedVariable);
  }

  return uri;
}

function makeFilePath(dir: string, name: string) {
  return path.join(dir, name);
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    await fsPromises.mkdir(dir, { recursive: true });
  }
}

async function updateLargestVersions() {
  const files = fs.readdirSync(urls.tapinXml.dir);
  const largestMajorValues: number[] = [];
  const largestMinorValues: number[] = [];

  for (const file of files) {
    const fullPath = path.join(urls.tapinXml.dir, file);

    // Check if it's an XML file
    if (path.extname(fullPath) === '.xml') {
      const xmlContent = fs.readFileSync(fullPath, 'utf-8');

      try {
        const result = await xml2js.parseStringPromise(xmlContent);
        const lensinfo = result.lensinfo.split(',');

        const majorValue = Number(lensinfo[3].slice(0,2));
        if (majorValue !== undefined) {
          largestMajorValues.push(majorValue);
        }

        const minorValue = Number(lensinfo[3].slice(2,4));
        if (minorValue !== undefined) {
          largestMinorValues.push(minorValue);
        }
      } catch (error) {
        console.error(`Error parsing XML file ${file}: ${error.message}`);
      }
    }
  }

  // Store the largest values
  firwareMax.major = Math.max(...largestMajorValues);
  firwareMax.minor = Math.max(...largestMinorValues);
  console.log(`The largest values found: Major:${firwareMax.major} Minor:${firwareMax.minor}`);
}

/* ------------------ Worker ------------------ */

async function downloadTapinLensData(lens: string, mount: string) {
  // XML
  const xmlUri = buildUrl(urls.tapinXml, [lens, mount]);
  console.log(`[try] ${lens} / ${mount} -> XML -> ${xmlUri}`);

  const xmlRes = await fetch(xmlUri);

  if (xmlRes.ok) {
    await ensureDir(urls.tapinXml.dir);
    const xmlPath = makeFilePath(urls.tapinXml.dir, `lensinfo_${sanitizeFileName(lens)}${sanitizeFileName(mount)}.xml`);
    const xmlStream = fs.createWriteStream(xmlPath);
    await finished(Readable.fromWeb(xmlRes.body).pipe(xmlStream));

    console.log(`[saved] ${xmlPath}`);

    // Images
    const images = [
      "tapinLensImage",
      "tapinFocusAdjustment",
      "tapinFocusLimit",
    ]
    for (const image of images) {
      const imageUri = buildUrl(urls[image], [lens, mount]);
      console.log(`[try] ${lens} / ${mount} -> ${image} -> ${imageUri}`);
      const imageRes = await fetch(imageUri);

      if (imageRes.ok) {
        await ensureDir(urls[image].dir);
        const imagePath = makeFilePath(urls[image].dir, `${image}_${sanitizeFileName(lens)}-${sanitizeFileName(mount)}.png`);
        const imageStream = fs.createWriteStream(imagePath);
        await finished(Readable.fromWeb(imageRes.body).pipe(imageStream));

        console.log(`[saved] ${imagePath}`);

        if (image === 'tapinLensImage') {
          const imageMagick = child_process.execSync(`convert ${imagePath} -alpha set -fuzz 15% -fill none -draw "color 0,0 floodfill" ${imagePath}`);
        } else {
          const imageMagick = child_process.execSync(`convert ${imagePath} -alpha set -fuzz 10% -transparent "$(identify -format "%[pixel:p{0,0}]" ${imagePath})" ${imagePath}`);
        }
        console.log(`[edited] ${imagePath}`);
      } else {
        console.log(`[failed] ${lens} / ${mount} -> ${image} -> ${imageRes.status} at ${imageUri}`);
      }
    }
  } else {
    const msg = `HTTP ${xmlRes.status} ${xmlRes.statusText}`;
    throw new Error(msg);
  }
  return;
}

async function downloadTapinLensFirmware(lens: string, mount: string) {
  console.log(`[try] ${lens} / ${mount} -> Firmware Download`);

  for (let major = 0; major < firwareMax.major + 1; major++) {
    const majorStr = major.toString().padStart(2, '0');
    for (let minor = 0; minor < firwareMax.minor + 1; minor++) {
      const minorStr = minor.toString().padStart(2, '0');
      const firmwareUri = buildUrl(urls.tapinLensFirmware, [lens, mount, majorStr, minorStr]);
      const firmwareRes = await fetch(firmwareUri);

      if (firmwareRes.ok) {
        await ensureDir(urls.tapinLensFirmware.dir);
        const firmwarePath = makeFilePath(urls.tapinLensFirmware.dir, `${sanitizeFileName(lens)}${sanitizeFileName(mount)}_${majorStr}${minorStr}.tfwf`);
        const firmwareStream = fs.createWriteStream(firmwarePath);
        await finished(Readable.fromWeb(firmwareRes.body).pipe(firmwareStream));

        console.log(`[saved] ${lens} / ${mount} -> $Firmware v${major}.${minor} -> ${firmwarePath}`);
      }
    }
  }
  return;
}

async function downloadTapinAdapterFirmware() {
  console.log(`[try] Adapter -> Firmware Download`);

  // Determine the latest adapter version
  const fullPath = path.join(staticUrls.tapinInfo.dir, staticUrls.tapinInfo.name);

  // Check if path exists
  if (fs.existsSync(fullPath)) {
    const xmlContent = fs.readFileSync(fullPath, 'utf-8');

    try {
      const result = await xml2js.parseStringPromise(xmlContent);
      const tapinInfo = result.tapininfo.split(',');

      const majorValue = Number(tapinInfo[1].slice(0,2));
      const minorValue = Number(tapinInfo[1].slice(2,4));

      for (let major = 0; major < majorValue + 1; major++) {
        const majorStr = major.toString().padStart(2, '0');
        for (let minor = 0; minor < minorValue + 1; minor++) {
          const minorStr = minor.toString().padStart(2, '0');
          const firmwareUri = buildUrl(urls.tapinAdapterFirmware, [majorStr, minorStr]);
          const firmwareRes = await fetch(firmwareUri);

          if (firmwareRes.ok) {
            await ensureDir(urls.tapinAdapterFirmware.dir);
            const firmwarePath = makeFilePath(urls.tapinAdapterFirmware.dir, `AY042_${majorStr}${minorStr}.tfwf`);
            const firmwareStream = fs.createWriteStream(firmwarePath);
            await finished(Readable.fromWeb(firmwareRes.body).pipe(firmwareStream));

            console.log(`[saved] Adapter -> $Firmware v${major}.${minor} -> ${firmwarePath}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing XML file ${fullPath}: ${error.message}`);
    }
  } else {
    console.error(`Adapter XML doesn't exist at ${fullPath}`)
  }

  return;
}

/* ------------------ Concurrency runner ------------------ */

// Simple concurrency pool
async function runAll() {
  const combos: { lens: string; mount: string }[] = [];
  for (const lens of tapinLensNames) {
    for (const mount of tapinMounts) {
      combos.push({ lens, mount });
    }
  }

  console.log(`Starting ${combos.length} downloads (concurrency=${CONCURRENCY})`);

  let results: Promise<any>[] = [];
  let running: Promise<any>[] = [];

  for (const combo of combos) {
    const p = (async () => {
      try {
        return await downloadTapinLensData(combo.lens, combo.mount);
      } catch (err: any) {
        console.error(`[failed] ${combo.lens}/${combo.mount} -> ${err.message}`);
        return { error: true, lens: combo.lens, mount: combo.mount, message: err.message };
      }
    })();

    results.push(p);
    running.push(p);

    if (running.length >= CONCURRENCY) {
      // wait for any to finish
      await Promise.race(running).catch(() => undefined);
      // remove resolved promises from running
      for (let i = running.length - 1; i >= 0; i--) {
        if (running[i].then) {
          // this is not straightforward to check - easier to filter by settled promises using Promise.allSettled
        }
      }
      // Compact running by keeping only unsettled
      const settled = await Promise.allSettled(running);
      const stillRunning: Promise<any>[] = [];
      for (let i = 0; i < settled.length; i++) {
        if (settled[i].status === "pending") {
          stillRunning.push(running[i]);
        }
      }
      // But Promise.allSettled doesn't return pending statuses — easier approach: rebuild running by filtering out fulfilled/rejected
      // Simpler: replace running with only those that are not settled by checking Promise.race trick next loop iteration.
      // To keep code simple and robust, we reset running to a slice containing only last N promises:
      // (safe because we awaited at least one)
      running.length = 0;
    }
  }

  // Wait for all
  const finalData = await Promise.all(results);
  const failuresData = finalData.filter((r) => r && r.error);

  await updateLargestVersions();

  results = [];
  running = [];

  // Download all firmwares up to that version
  for (const combo of combos) {
    const p = (async () => {
      try {
        return await downloadTapinLensFirmware(combo.lens, combo.mount);
      } catch (err: any) {
        console.error(`[failed] ${combo.lens}/${combo.mount} -> ${err.message}`);
        return { error: true, lens: combo.lens, mount: combo.mount, message: err.message };
      }
    })();

    results.push(p);
    running.push(p);

    if (running.length >= CONCURRENCY) {
      // wait for any to finish
      await Promise.race(running).catch(() => undefined);
      // remove resolved promises from running
      for (let i = running.length - 1; i >= 0; i--) {
        if (running[i].then) {
          // this is not straightforward to check - easier to filter by settled promises using Promise.allSettled
        }
      }
      // Compact running by keeping only unsettled
      const settled = await Promise.allSettled(running);
      const stillRunning: Promise<any>[] = [];
      for (let i = 0; i < settled.length; i++) {
        if (settled[i].status === "pending") {
          stillRunning.push(running[i]);
        }
      }
      // But Promise.allSettled doesn't return pending statuses — easier approach: rebuild running by filtering out fulfilled/rejected
      // Simpler: replace running with only those that are not settled by checking Promise.race trick next loop iteration.
      // To keep code simple and robust, we reset running to a slice containing only last N promises:
      // (safe because we awaited at least one)
      running.length = 0;
    }
  }

  for (const [key, value] of Object.entries(staticUrls)) {
    // Download the tapininfo
    console.log(`[try] ${value.name} -> ${value.path}`);
    const staticUrlRes = await fetch(value.path);

    if (staticUrlRes.ok) {
      await ensureDir(value.dir);
      const staticUrlPath = makeFilePath(value.dir, `tapininfo.xml`);
      const staticUrlStream = fs.createWriteStream(staticUrlPath);
      await finished(Readable.fromWeb(staticUrlRes.body).pipe(staticUrlStream));

      console.log(`[saved] ${staticUrlPath}`);
    } else {
      console.log(`[failed] ${value.name} -> ${staticUrlRes.status} at ${value.path}`);
    }
  }

  // Wait for all
  const finalLensFirmware = await Promise.all(results);
  const failuresLensFirmware = finalLensFirmware.filter((r) => r && r.error);

  results = [];
  running = [];

  // Download all firmwares for the adapter
  const p = (async () => {
    try {
      return await downloadTapinAdapterFirmware();
    } catch (err: any) {
      console.error(`[failed] Adapter -> ${err.message}`);
      return { error: true, message: err.message };
    }
  })();

  results.push(p);
  running.push(p);

  if (running.length >= CONCURRENCY) {
    // wait for any to finish
    await Promise.race(running).catch(() => undefined);
    // remove resolved promises from running
    for (let i = running.length - 1; i >= 0; i--) {
      if (running[i].then) {
        // this is not straightforward to check - easier to filter by settled promises using Promise.allSettled
      }
    }
    // Compact running by keeping only unsettled
    const settled = await Promise.allSettled(running);
    const stillRunning: Promise<any>[] = [];
    for (let i = 0; i < settled.length; i++) {
      if (settled[i].status === "pending") {
        stillRunning.push(running[i]);
      }
    }
    // But Promise.allSettled doesn't return pending statuses — easier approach: rebuild running by filtering out fulfilled/rejected
    // Simpler: replace running with only those that are not settled by checking Promise.race trick next loop iteration.
    // To keep code simple and robust, we reset running to a slice containing only last N promises:
    // (safe because we awaited at least one)
    running.length = 0;
  }

  // Wait for all
  const finalAdapterFirmware = await Promise.all(results);
  const failuresAdapterFirmware = finalAdapterFirmware.filter((r) => r && r.error);

  // We don't expect all to be a success
  // We have lenses that may not be used with TAP-in, and lens/mount combinations that weren't made
  console.log(`Finished\nLenses: ${finalData.length}\n\tSuccesses: ${finalData.length - failuresData.length}\n\tFailures: ${failuresData.length}\nLens Firmware: ${finalLensFirmware.length}\n\tSuccesses: ${finalLensFirmware.length - failuresLensFirmware.length}\n\tFailures: ${failuresLensFirmware.length}\nAdapter Firmware: ${finalAdapterFirmware.length}\n\tSuccesses: ${finalAdapterFirmware.length - failuresAdapterFirmware.length}\n\tFailures: ${failuresAdapterFirmware.length}`);
}

/* ------------------ Run ------------------ */

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith("index.ts")) {
  runAll().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
