const {
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
  withSettingsGradle,
} = require("expo/config-plugins");
const fs = require("node:fs/promises");
const path = require("node:path");

const WATERMELON_JSI_PROJECT = "include ':watermelondb-jsi'";
const WATERMELON_JSI_DEPENDENCY = "implementation project(':watermelondb-jsi')";
const WATERMELON_JSI_PACKAGE = "WatermelonDBJSIPackage()";
const WATERMELON_KEEP_RULE = "-keep class com.nozbe.watermelondb.** { *; }";

function withWatermelonSettingsGradle(config) {
  return withSettingsGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(WATERMELON_JSI_PROJECT)) {
      mod.modResults.contents += `

${WATERMELON_JSI_PROJECT}
project(':watermelondb-jsi').projectDir = new File([
    'node', '--print',
    "require.resolve('@nozbe/watermelondb/package.json')"
].execute(null, rootProject.projectDir).text.trim(), '../native/android-jsi')
`;
    }

    return mod;
  });
}

function withWatermelonAppBuildGradle(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(WATERMELON_JSI_DEPENDENCY)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        "dependencies {",
        `dependencies {
    ${WATERMELON_JSI_DEPENDENCY}`,
      );
    }

    return mod;
  });
}

function withWatermelonMainApplication(config) {
  return withMainApplication(config, (mod) => {
    if (
      !mod.modResults.contents.includes(
        "import com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage",
      )
    ) {
      mod.modResults.contents = mod.modResults.contents.replace(
        "import android.app.Application",
        `import android.app.Application
import com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage`,
      );
    }

    if (!mod.modResults.contents.includes(WATERMELON_JSI_PACKAGE)) {
      const manualPackageComment = "// add(MyReactNativePackage())";

      if (mod.modResults.contents.includes(manualPackageComment)) {
        mod.modResults.contents = mod.modResults.contents.replace(
          manualPackageComment,
          `${manualPackageComment}
              add(${WATERMELON_JSI_PACKAGE})`,
        );
      } else {
        mod.modResults.contents = mod.modResults.contents.replace(
          "PackageList(this).packages.apply {",
          `PackageList(this).packages.apply {
              add(${WATERMELON_JSI_PACKAGE})`,
        );
      }
    }

    return mod;
  });
}

function withWatermelonProguard(config) {
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const proguardPath = path.join(
        mod.modRequest.platformProjectRoot,
        "app",
        "proguard-rules.pro",
      );
      const contents = await fs.readFile(proguardPath, "utf8");

      if (!contents.includes(WATERMELON_KEEP_RULE)) {
        await fs.writeFile(
          proguardPath,
          `${contents.trimEnd()}\n\n${WATERMELON_KEEP_RULE}\n`,
        );
      }

      return mod;
    },
  ]);
}

function withWatermelonPods(config) {
  return withDangerousMod(config, [
    "ios",
    async (mod) => {
      const podfilePath = path.join(
        mod.modRequest.platformProjectRoot,
        "Podfile",
      );
      const contents = await fs.readFile(podfilePath, "utf8");

      if (!contents.includes("pod 'simdjson'")) {
        const simdjsonPod =
          "  pod 'simdjson', path: File.join(File.dirname(`node --print \"require.resolve('@nozbe/simdjson/package.json')\"`)), :modular_headers => true\n\n";

        await fs.writeFile(
          podfilePath,
          contents.replace(
            "  use_expo_modules!\n",
            `  use_expo_modules!\n\n${simdjsonPod}`,
          ),
        );
      }

      return mod;
    },
  ]);
}

function withWatermelonDB(config) {
  let nextConfig = config;

  nextConfig = withWatermelonSettingsGradle(nextConfig);
  nextConfig = withWatermelonAppBuildGradle(nextConfig);
  nextConfig = withWatermelonMainApplication(nextConfig);
  nextConfig = withWatermelonProguard(nextConfig);
  nextConfig = withWatermelonPods(nextConfig);

  return nextConfig;
}

module.exports = withWatermelonDB;
