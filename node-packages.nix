# This file has been generated by node2nix 1.11.0. Do not edit!

{nodeEnv, fetchurl, fetchgit, nix-gitignore, stdenv, lib, globalBuildInputs ? []}:

let
  sources = {
    "@types/validator-13.11.1" = {
      name = "_at_types_slash_validator";
      packageName = "@types/validator";
      version = "13.11.1";
      src = fetchurl {
        url = "https://registry.npmjs.org/@types/validator/-/validator-13.11.1.tgz";
        sha512 = "d/MUkJYdOeKycmm75Arql4M5+UuXmf4cHdHKsyw1GcvnNgL6s77UkgSgJ8TE/rI5PYsnwYq5jkcWBLuN/MpQ1A==";
      };
    };
    "class-transformer-0.5.1" = {
      name = "class-transformer";
      packageName = "class-transformer";
      version = "0.5.1";
      src = fetchurl {
        url = "https://registry.npmjs.org/class-transformer/-/class-transformer-0.5.1.tgz";
        sha512 = "SQa1Ws6hUbfC98vKGxZH3KFY0Y1lm5Zm0SY8XX9zbK7FJCyVEac3ATW0RIpwzW+oOfmHE5PMPufDG9hCfoEOMw==";
      };
    };
    "class-validator-0.14.0" = {
      name = "class-validator";
      packageName = "class-validator";
      version = "0.14.0";
      src = fetchurl {
        url = "https://registry.npmjs.org/class-validator/-/class-validator-0.14.0.tgz";
        sha512 = "ct3ltplN8I9fOwUd8GrP8UQixwff129BkEtuWDKL5W45cQuLd19xqmTLu5ge78YDm/fdje6FMt0hGOhl0lii3A==";
      };
    };
    "libphonenumber-js-1.10.44" = {
      name = "libphonenumber-js";
      packageName = "libphonenumber-js";
      version = "1.10.44";
      src = fetchurl {
        url = "https://registry.npmjs.org/libphonenumber-js/-/libphonenumber-js-1.10.44.tgz";
        sha512 = "svlRdNBI5WgBjRC20GrCfbFiclbF0Cx+sCcQob/C1r57nsoq0xg8r65QbTyVyweQIlB33P+Uahyho6EMYgcOyQ==";
      };
    };
    "reflect-metadata-0.1.13" = {
      name = "reflect-metadata";
      packageName = "reflect-metadata";
      version = "0.1.13";
      src = fetchurl {
        url = "https://registry.npmjs.org/reflect-metadata/-/reflect-metadata-0.1.13.tgz";
        sha512 = "Ts1Y/anZELhSsjMcU605fU9RE4Oi3p5ORujwbIKXfWa+0Zxs510Qrmrce5/Jowq3cHSZSJqBjypxmHarc+vEWg==";
      };
    };
    "validator-13.11.0" = {
      name = "validator";
      packageName = "validator";
      version = "13.11.0";
      src = fetchurl {
        url = "https://registry.npmjs.org/validator/-/validator-13.11.0.tgz";
        sha512 = "Ii+sehpSfZy+At5nPdnyMhx78fEoPDkR2XW/zimHEL3MyGJQOCQ7WeP20jPYRz7ZCpcKLB21NxuXHF3bxjStBQ==";
      };
    };
  };
  args = {
    name = "_at_sapphirecode_slash_dcm";
    packageName = "@sapphirecode/dcm";
    version = "1.0.0";
    src = ./.;
    dependencies = [
      sources."@types/validator-13.11.1"
      sources."class-transformer-0.5.1"
      sources."class-validator-0.14.0"
      sources."libphonenumber-js-1.10.44"
      sources."reflect-metadata-0.1.13"
      sources."validator-13.11.0"
    ];
    buildInputs = globalBuildInputs;
    meta = {
      description = "Managing docker compose configurations, volumes and networks";
      license = "MIT";
    };
    production = true;
    bypassCache = true;
    reconstructLock = true;
  };
in
{
  args = args;
  sources = sources;
  tarball = nodeEnv.buildNodeSourceDist args;
  package = nodeEnv.buildNodePackage args;
  shell = nodeEnv.buildNodeShell args;
  nodeDependencies = nodeEnv.buildNodeDependencies (lib.overrideExisting args {
    src = stdenv.mkDerivation {
      name = args.name + "-package-json";
      src = nix-gitignore.gitignoreSourcePure [
        "*"
        "!package.json"
        "!package-lock.json"
      ] args.src;
      dontBuild = true;
      installPhase = "mkdir -p $out; cp -r ./* $out;";
    };
  });
}
