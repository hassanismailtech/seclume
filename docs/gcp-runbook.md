# GCP playground runbook: first deployment

Reviewed against the linked official documentation on 2026-11-23. This is an operator guide for an authorized **synthetic-only** playground deployment, not evidence of a running service or authorization to launch. Read the [deployment boundary](deployment.md), [predeploy report](predeploy-report.md) and [release gates](release-checklist.md) first.

Only the standalone playground profile is used. Authentication is off in that profile; its public surface depends on the supplied restrictive Caddy configuration. The Proxy stays on host loopback, Redis has no published port, and playground requests emit no Telemetry Events or Upstream calls. Lite mode uses patterns and the Nigerian name gazetteer; GLiNER is unavailable. Existing storage/detection qualifications in the [limitations](limitations.md) still apply.

## Assumptions and where to type

| Location | Use |
|---|---|
| **Console** | Google Cloud web console, plus your existing DNS provider |
| **Cloud Shell** | Browser terminal opened from Google Cloud console; used for IAP SSH and later external smoke testing |
| **VM** | Ubuntu shell reached through IAP; privileged commands explicitly begin with `sudo` |

Run one block at a time in its labelled location. Stop on any error; expected results below are checks to perform, not results already obtained. Downloads are package keys/configuration, not installation scripts executed as root. There is no startup script, `curl | sh`, automatic sudo wrapper or cloud provisioning command to run on your own computer.

At the start of **each Cloud Shell or VM shell session**, enable fail-fast behavior before pasting subsequent blocks:

```sh
set -e
```

This makes a failed command stop the shell before later commands in the pasted block run. It can close an SSH session on error; reconnect, inspect the failure and resume only after resolving it. After reconnecting, re-enter the variable assignments needed for the step (`INSTALL_DIR="$HOME/seclume-install"` and `cd "$HOME/seclume"` once the checkout exists); do not source `deploy/.env` as a shortcut. No shell profile is changed.

This guide assumes a new, dedicated VPC, one Ubuntu 24.04 LTS amd64 `e2-small`, a regional static IPv4 address, and a 30 GB balanced boot disk. The disk size is a starting choice, not a measured minimum. Google lists e2-small with 2 GB memory and shared CPU capacity; build time and service capacity on this VM remain unmeasured. Review the Console cost estimate and [Compute pricing](https://cloud.google.com/products/compute/pricing/general-purpose) before creating resources. [Machine specification](https://docs.cloud.google.com/compute/docs/general-purpose-machines#e2_shared-core).

**Firewall model:** TCP 80/443 are the only ports allowed from the public internet. A separate TCP-22 rule permits SSH **only from Google's IAP range `35.235.240.0/20`**. Ports 8000, 6379 and the Caddy admin API are not opened publicly. This restricted SSH exception is necessary for IAP access; it is not a public SSH rule. Use IPv4 only for this procedure. [IAP firewall requirements](https://docs.cloud.google.com/iap/docs/using-tcp-forwarding).

No domain, mailbox, repository setting or website deployment is changed by adding this document. The example API host `api.seclume.tech` is configuration; use it only if you control that DNS record. Do not change existing website or mail records.

## 1. Console: project, network and access

1. Select the intended project and confirm billing, quota and the region are acceptable. Enable **Compute Engine API** (`compute.googleapis.com`), **Cloud Identity-Aware Proxy API** (`iap.googleapis.com`) and **Cloud OS Login API** (`oslogin.googleapis.com`) in APIs & Services if not already enabled. A project administrator must authorize resource creation and IAM changes.
2. Open **VPC network → VPC networks → Create VPC network**. Name it `seclume-playground-net`, choose custom subnet mode, and add `seclume-playground-subnet` in your selected region with IPv4 range `10.10.0.0/24`. Retain normal outbound internet access for package/image downloads. Do not add broad SSH, RDP or internal-ingress presets. This dedicated network avoids changing firewall rules for other workloads.
3. In **VPC network → Firewall**, create these ingress allow rules. Target each rule to the network tag `seclume-playground`, not every VM in the project:

   | Rule | Network | Source IPv4 range | Protocol/ports | Initial state |
   |---|---|---|---|---|
   | `seclume-iap-ssh` | `seclume-playground-net` | `35.235.240.0/20` | TCP `22` | Enabled |
   | `seclume-web` | `seclume-playground-net` | `0.0.0.0/0` | TCP `80,443` | **Disabled until step 8** |

   Use the normal allow-rule priority, 1000. Review effective/inherited firewall policies: a higher-level firewall policy can still allow or deny traffic. Do not assume adding an IAP rule removes a pre-existing public SSH rule. [Firewall controls](https://docs.cloud.google.com/firewall/docs/using-firewalls).
4. In **IAM & Admin → IAM**, the administrator grants your operator Google identity **Compute OS Admin Login** (`roles/compute.osAdminLogin`) at project level, and **IAP-secured Tunnel User** (`roles/iap.tunnelResourceAccessor`). Restrict the latter with the condition `destination.port == 22`. OS Admin Login provides the sudo access needed below. Project-level OS Login also supplies the project lookup permission needed by Console/gcloud SSH. An external organization identity can require additional administrator approval; follow [OS Login role requirements](https://docs.cloud.google.com/compute/docs/oslogin/set-up-oslogin). Do not grant these roles to all users.

## 2. Console: reserve the IP and create the VM

1. Open **VPC network → IP addresses → Reserve external static IP address**. Reserve `seclume-playground-ip`, IPv4, regional, in the **same region** as the VM. Keep the network tier consistent with the VM's interface. Record the address. [Static IP instructions](https://docs.cloud.google.com/compute/docs/ip-addresses/configure-static-external-ip-address).
2. Open **Compute Engine → VM instances → Create instance**. Name it `seclume-playground`; choose a zone in that region, E2 series, shared-core **e2-small**, standard provisioning, and Ubuntu **24.04 LTS amd64** with the chosen balanced boot disk. Keep the normal Shielded VM defaults. This guide does not use a GPU or a Spot VM.
3. Under Networking, choose the dedicated VPC/subnet, add network tag `seclume-playground`, and select the reserved external IPv4 address. Leave IPv6 off. Leave the generic **Allow HTTP/HTTPS traffic** checkboxes unchecked; the scoped web rule above will be enabled later.
4. Select **no service account** for this VM: the playground needs no Google API credentials. Under instance metadata, add `enable-oslogin` with value `TRUE`. Leave startup scripts empty, then create the VM. [VM creation instructions](https://docs.cloud.google.com/compute/docs/instances/create-start-instance).
5. Verify the VM's machine type, OS, tag, network and static IP in its details. Confirm only the IAP SSH rule is enabled for it at this point.

## 3. Cloud Shell: connect over IAP

Open Cloud Shell. Enter your actual project ID and the VM's zone when prompted; the VM name matches step 2. `--tunnel-through-iap` forces the administrative connection through IAP even though the VM has a public IP.

```sh
set -e
printf 'Google Cloud project ID: '
read -r PROJECT_ID
printf 'VM zone: '
read -r VM_ZONE
gcloud compute ssh seclume-playground \
  --project "$PROJECT_ID" --zone "$VM_ZONE" --tunnel-through-iap
```

Confirm any SSH key-generation/host-key prompt after checking the target. You are now in the **VM** shell. See [IAP SSH instructions](https://docs.cloud.google.com/compute/docs/connect/ssh-using-iap).

**SSH hardening note:** retain OS Login and IAP, keep SSH password authentication and direct root login disabled, and keep private keys private. Do not replace Google's OS Login/PAM integration with an unrelated SSH tutorial. Test a second IAP session before closing your working session or changing SSH configuration. After any deliberate SSH change, validate it with the command below before applying it:

```sh
sudo /usr/sbin/sshd -t
```

No output with exit 0 means syntax validation passed; it does not prove a second login works. If sudo access is missing, fix the OS Login role rather than opening public SSH.

## 4. VM: install Docker and Caddy

First confirm `/etc/os-release` identifies Ubuntu 24.04 and the architecture command prints `amd64`. Stop if either differs; the repository configuration below is specific to this OS/architecture.

```sh
set -e
cat /etc/os-release
dpkg --print-architecture
```

Install the package/key-management tools. Review apt's prompts; each sudo command is explicitly invoked by you.

```sh
sudo apt update
sudo apt install ca-certificates curl git gnupg debian-keyring debian-archive-keyring apt-transport-https
```

Create a user-owned working directory for public installation metadata, download Docker's signing key, and install it readably for apt. This directory is outside the Git checkout.

```sh
INSTALL_DIR="$HOME/seclume-install"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
curl --fail --silent --show-error --location \
  https://download.docker.com/linux/ubuntu/gpg --output docker.asc
sudo install -d -m 0755 /etc/apt/keyrings
sudo install -m 0644 docker.asc /etc/apt/keyrings/docker.asc
```

Write the official Docker apt source for Ubuntu Noble/amd64, then install Engine, Buildx and the Compose plugin. [Docker's Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/).

```sh
cat > docker.sources <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: noble
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo install -m 0644 docker.sources /etc/apt/sources.list.d/docker.sources
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

Keep using explicit `sudo docker` commands rather than adding an account to Docker's root-equivalent group. The version checks must reach the Docker server, not just print a client version.

Download the Caddy stable repository metadata as your ordinary user, convert its public key locally, then install the key/list for apt. The package automatically starts a default Caddy service; stop it immediately while web ingress is still disabled. [Caddy's official package instructions](https://caddyserver.com/docs/install#debian-ubuntu-raspbian).

```sh
curl --fail --silent --show-error --location \
  https://dl.cloudsmith.io/public/caddy/stable/gpg.key --output caddy.key
gpg --dearmor --output caddy-stable-archive-keyring.gpg caddy.key
curl --fail --silent --show-error --location \
  https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt --output caddy-stable.list
sudo install -m 0644 caddy-stable-archive-keyring.gpg /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo install -m 0644 caddy-stable.list /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
sudo systemctl stop caddy
caddy version
command -v caddy
```

The binary path should be `/usr/bin/caddy`, as used by the service override below. Save the installed Docker/Compose/Caddy versions in your operator notes. Host packages and image bases can change independently of the pinned application source.

## 5. VM: clone a reviewed commit and fill deploy/.env

This procedure pins deployment source to the reviewed XQ1 commit, not a moving branch or an assumed release tag. Its [CI](https://github.com/hassanismailtech/seclume/actions/runs/45080426092) and [evaluation](https://github.com/hassanismailtech/seclume/actions/runs/45080426089) passed; those runner results are not evidence of GCP deployment or e2-small capacity. [Source commit](https://github.com/hassanismailtech/seclume/commit/b4c87dfe45d5e189b30aba71440252409270c246).

```sh
cd "$HOME"
SECLUME_COMMIT=b4c87dfe45d5e189b30aba71440252409270c246
git clone --no-checkout https://github.com/hassanismailtech/seclume.git seclume
cd seclume
git checkout --detach "$SECLUME_COMMIT"
test "$(git rev-parse HEAD)" = "$SECLUME_COMMIT"
git status --short
```

The comparison must exit 0 and status must be empty. If `~/seclume` already exists, stop and inspect it; do not delete or overwrite another checkout. Keep this VM shell open through step 8 so the variables remain available.

Enter the bare API hostname you control, such as `api.seclume.tech`, and the exact HTTPS website origin, such as `https://seclume.tech`. The hostname has no scheme/path; the origin has no path or trailing slash. Neither field contains a password or provider key.

```sh
set -e
printf 'Bare API hostname: '
read -r PLAYGROUND_HOST
printf 'Allowed HTTPS website origin: '
read -r CORS_ORIGINS
SECLUME_IMAGE="aegis:playground-${SECLUME_COMMIT}-lite"
umask 077
cp deploy/.env.example deploy/.env
cat > deploy/.env <<EOF
SECLUME_IMAGE=$SECLUME_IMAGE
CORS_ORIGINS=$CORS_ORIGINS
PLAYGROUND_HOST=$PLAYGROUND_HOST
EOF
chmod 0600 deploy/.env
git check-ignore deploy/.env
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml config --quiet
```

The ignore check should identify `deploy/.env`; quiet validation must exit 0. Review the three public settings in your editor before continuing. Do not source `.env` as a shell script or commit it. The existing profile supplies empty credentials, lite mode and its explicit isolated-development startup bypass; do not add a provider key or publish the raw Proxy port. Compose does not configure the native Caddy service's environment.

## 6. VM: build lite and start the standalone profile

The Compose file explicitly selects Docker target `lite`. Build only its `aegis` service; a plain Docker build without a target would select the full runtime instead.

```sh
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml build aegis
sudo docker image inspect --format '{{.Id}}' "$SECLUME_IMAGE"
sudo docker image inspect --format '{{.Size}}' "$SECLUME_IMAGE"
```

Record the actual image ID and size. These identify a local build, not a registry digest or reproducible-build claim. If the build fails, runs out of memory or fills the disk, stop and record that result; this guide has not measured an e2-small build. Check free space with `df -h` before retrying. Do not substitute the full model image or prune rollback images to hide a failure.

Start Redis and the Proxy, waiting for health. Never combine this file with the development Compose file.

```sh
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml \
  up --detach --no-build --wait --wait-timeout 180
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml ps
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml exec -T redis redis-cli ping
curl --fail --silent --show-error --connect-timeout 5 --max-time 10 \
  --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:8000/readyz
```

Both containers must be healthy, Redis must answer `PONG`, and local readiness must return 200. The curl command prints only status, not its response body. This internal readiness route will be blocked by public Caddy.

Inspect the effective Redis port bindings. The result must be empty (`{}` or `null`), while Compose's Proxy listing must show only `127.0.0.1:8000` published.

```sh
REDIS_CONTAINER="$(sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml ps --quiet redis)"
sudo docker inspect --format '{{json .HostConfig.PortBindings}}' "$REDIS_CONTAINER"
```

Fix unexpected bindings before enabling web ingress. Redis has no persistent volume; its snapshots/AOF are disabled. The existing audit startup dependency uses the profile's temporary `/tmp`, separately from Redis state. Do not add a Redis volume or new state store.

## 7. VM: configure the native Caddy systemd service

Copy the reviewed Caddyfile into the packaged service's normal location. Give systemd a root-readable environment file containing only the public hostname, rather than access to your home directory or future application secrets.

```sh
sudo install -o root -g caddy -m 0640 deploy/Caddyfile /etc/caddy/Caddyfile
printf 'PLAYGROUND_HOST=%s\n' "$PLAYGROUND_HOST" > "$INSTALL_DIR/caddy-playground.env"
sudo install -o root -g root -m 0600 "$INSTALL_DIR/caddy-playground.env" /etc/caddy/playground.env
```

Create a drop-in file as your ordinary user, then explicitly install it. `EnvironmentFile` is read by the system service manager. The `ExecStart` override avoids the packaged `--environ` startup dump; clearing `ExecReload` removes the API reload command, since this Caddyfile sets `admin off`. Configuration updates use a validated restart with a brief interruption. [Service environment/overrides](https://caddyserver.com/docs/running#overrides), [admin-off behavior](https://caddyserver.com/docs/caddyfile/options#admin).

```sh
cat > "$INSTALL_DIR/playground.conf" <<'EOF'
[Service]
EnvironmentFile=/etc/caddy/playground.env
ExecStart=
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
ExecReload=
EOF
sudo install -d -m 0755 /etc/systemd/system/caddy.service.d
sudo install -o root -g root -m 0644 "$INSTALL_DIR/playground.conf" /etc/systemd/system/caddy.service.d/playground.conf
sudo caddy validate --envfile deploy/.env --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl daemon-reload
```

Validation must exit 0. Leave Caddy stopped until DNS is ready. Preserve the supplied logging restrictions and header/path handling. This trades request diagnostics for privacy; do not enable access logs or print request/response bodies to debug a failed smoke test. Caddy certificate/account state belongs under its packaged service storage in `/var/lib/caddy`; it is separate from ephemeral Redis and must survive routine rollback.

## 8. Console, DNS provider, then VM: expose the reviewed ingress

1. **DNS provider:** add an A record for the chosen API hostname pointing to the VM's reserved IPv4 address. Use DNS-only operation, without a CDN/reverse-proxy layer. Remove only an incorrect API-host AAAA record if one exists; this procedure provisions no IPv6 service. Leave existing website/MX/TXT/mail records alone. Confirm the public A lookup resolves to the reserved IP before continuing.
2. **Console:** review the VM's effective firewall rules again. Enable `seclume-web` for public TCP 80/443 only. The separately restricted IAP SSH rule remains. Neither Docker port 8000 nor Redis port 6379 gets an internet allow rule.
3. **VM:** start Caddy using the installed file and environment. Ports 80/443 and correct DNS allow Caddy's normal certificate validation; actual certificate issuance must be observed, not presumed. [Automatic HTTPS requirements](https://caddyserver.com/docs/automatic-https).

```sh
sudo systemctl enable caddy
sudo systemctl restart caddy
sudo systemctl is-active caddy
curl --fail --silent --show-error --connect-timeout 5 --max-time 15 \
  --output /dev/null --write-out '%{http_code}\n' "https://$PLAYGROUND_HOST/healthz"
```

Require an active service and HTTPS 200 with normal TLS verification. If DNS, TLS or readiness fails, stop here; do not use `curl -k`, expose `/readyz`, widen the firewall or switch on the admin API. Successful `/healthz` alone does not validate the rest of the public boundary.

## 9. Cloud Shell: external smoke test

Open a **new Cloud Shell tab outside the VM SSH session**. This test must reach the public hostname from another machine/network. Enter the same API hostname and allowed website origin. Clone the same source so the smoke script matches the deployed code:

```sh
set -e
printf 'Bare API hostname: '
read -r PLAYGROUND_HOST
printf 'Allowed HTTPS website origin: '
read -r CORS_ORIGINS
SECLUME_COMMIT=b4c87dfe45d5e189b30aba71440252409270c246
git clone --no-checkout https://github.com/hassanismailtech/seclume.git seclume-smoke
cd seclume-smoke
git checkout --detach "$SECLUME_COMMIT"
test "$(git rev-parse HEAD)" = "$SECLUME_COMMIT"
curl --version
sh scripts/smoke_playground.sh "https://$PLAYGROUND_HOST" "$CORS_ORIGINS"
```

Use a fresh directory; inspect an existing one instead of overwriting it. The script requires POSIX sh and curl 8.4 or later. It prints seven PASS/FAIL lines and must exit 0. It checks scrubbed JSON/no-store, blocked routes, CORS, quota/Retry-After, forged forwarded IPs, status-only health and private paths/methods. It submits only the existing synthetic fixture and prints no request/response bodies. Its rate tests consume this client's allowance; use a quiet address/window and read the [smoke-test qualifications](deployment.md#external-playground-smoke-script).

Cloud Shell's installed curl version must be checked, not assumed. If it is too old, use an external Ubuntu 24.04/WSL shell on your computer instead, install the client tools below, confirm the curl requirement, then run the same checkout/smoke block there. These commands belong on that external client, not the playground VM:

```sh
set -e
sudo apt update
sudo apt install git curl
curl --version
```

Record the source commit, local image ID, tool versions, test time and the seven status lines in your operator record. A failure remains a failed deployment check. Do not set the website's public API URL until these checks pass and the website deployment is separately authorized; this document does not change the website configuration.

## 10. Rollback and first-deployment shutdown

### If the first deployment fails

**Console:** disable only `seclume-web`, retaining IAP access. **VM:** stop public Caddy and remove this isolated Compose stack. The commands below operate on the standalone profile only:

```sh
set -e
unset SECLUME_IMAGE CORS_ORIGINS PLAYGROUND_HOST COMPOSE_PROJECT_NAME COMPOSE_FILE
cd "$HOME/seclume"
sudo systemctl disable --now caddy
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml down --remove-orphans
```

The endpoint is offline. Keep the static IP/DNS allocation if investigating; stopping a VM does not delete its disk or reserved address. Review retained resources and charges in Console, and release/delete only the resources you deliberately created when abandoning the deployment. Do not delete `/var/lib/caddy` or unrelated project resources as a generic cleanup step.

### Before any later upgrade

**VM:** after a successful deployment and before changing it, save the known-good source/configuration and retain its local image. The backup directory must be new; `mkdir` will fail if that deployment's backup already exists. These backups contain configuration/identifiers, not request transcripts or Redis Session Map contents.

```sh
set -e
unset SECLUME_IMAGE CORS_ORIGINS PLAYGROUND_HOST COMPOSE_PROJECT_NAME COMPOSE_FILE
cd "$HOME/seclume"
GOOD_COMMIT="$(git rev-parse HEAD)"
ROLLBACK_DIR="$HOME/seclume-rollback-$GOOD_COMMIT"
mkdir -m 0700 "$ROLLBACK_DIR"
git rev-parse HEAD > "$ROLLBACK_DIR/source-commit.txt"
cp deploy/.env "$ROLLBACK_DIR/deploy.env"
cp deploy/compose.playground.yml "$ROLLBACK_DIR/compose.playground.yml"
sudo cp /etc/caddy/Caddyfile "$ROLLBACK_DIR/Caddyfile"
sudo cp /etc/caddy/playground.env "$ROLLBACK_DIR/playground.env"
sudo cp /etc/systemd/system/caddy.service.d/playground.conf "$ROLLBACK_DIR/playground.conf"
APP_CONTAINER="$(sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml ps --quiet aegis)"
sudo docker inspect --format '{{.Image}}' "$APP_CONTAINER" > "$ROLLBACK_DIR/image-id.txt"
```

The recorded image ID is the running Proxy's full image ID. Use a new commit-derived `SECLUME_IMAGE` tag for an upgrade; never rebuild over the old tag or prune the retained image. Record the backup directory. Host package upgrades and changes to the mutable `redis:7-alpine` tag are separate changes; these files do not roll back Ubuntu, Docker, Caddy or that Redis tag's previous contents.

### Restore a previous successful deployment

**Console:** disable `seclume-web` during recovery. **VM:** enter the recorded absolute backup-directory path. Stop if it is missing or the retained image ID is unavailable. The rollback/backup blocks clear shell overrides so the restored environment file and Compose project name control the operation. No image is pulled or rebuilt by this procedure.

```sh
set -e
unset SECLUME_IMAGE CORS_ORIGINS PLAYGROUND_HOST COMPOSE_PROJECT_NAME COMPOSE_FILE
printf 'Recorded absolute rollback directory: '
read -r ROLLBACK_DIR
test -d "$ROLLBACK_DIR"
GOOD_COMMIT="$(cat "$ROLLBACK_DIR/source-commit.txt")"
GOOD_IMAGE_ID="$(cat "$ROLLBACK_DIR/image-id.txt")"
sudo docker image inspect --format '{{.Id}}' "$GOOD_IMAGE_ID"
cd "$HOME/seclume"
git diff --quiet
git diff --cached --quiet
git checkout --detach "$GOOD_COMMIT"
cp "$ROLLBACK_DIR/deploy.env" deploy/.env
chmod 0600 deploy/.env
cmp "$ROLLBACK_DIR/compose.playground.yml" deploy/compose.playground.yml
```

Both quiet Git comparisons must exit 0 before checkout, and the Compose file comparison must exit 0 afterward. Confirm the retained **tag named by restored `SECLUME_IMAGE`** still resolves to the recorded image ID before starting it. Read that one data field with a fixed sed expression; do not execute the environment file as shell code:

```sh
RESTORED_IMAGE_TAG="$(sed -n 's/^SECLUME_IMAGE=//p' deploy/.env)"
test -n "$RESTORED_IMAGE_TAG"
test "$(sudo docker image inspect --format '{{.Id}}' "$RESTORED_IMAGE_TAG")" = "$GOOD_IMAGE_ID"
```

Then restore the ingress files with their permissions, validate, recreate the Proxy using the retained image, and restart the Caddy service:

```sh
sudo systemctl stop caddy
sudo install -o root -g caddy -m 0640 "$ROLLBACK_DIR/Caddyfile" /etc/caddy/Caddyfile
sudo install -o root -g root -m 0600 "$ROLLBACK_DIR/playground.env" /etc/caddy/playground.env
sudo install -o root -g root -m 0644 "$ROLLBACK_DIR/playground.conf" /etc/systemd/system/caddy.service.d/playground.conf
sudo caddy validate --envfile deploy/.env --config /etc/caddy/Caddyfile --adapter caddyfile
sudo docker compose --env-file deploy/.env -f deploy/compose.playground.yml \
  up --detach --no-build --pull never --force-recreate --wait --wait-timeout 180
sudo systemctl daemon-reload
sudo systemctl enable caddy
sudo systemctl restart caddy
sudo systemctl is-active caddy
```

Confirm Compose health, then re-enable the scoped web rule and repeat step 9 from the external client using the restored commit. A Redis recreation loses ephemeral state; rollback restores code/configuration, not historical Session Maps or rate counters. Preserve Caddy's certificate storage. If rollback checks fail, keep web ingress disabled and investigate rather than widening access.

## Verification status of this document

This document is preparation only. No VM, IAM role, firewall, static IP, DNS record, TLS certificate or deployment was created while writing it. Repository/command consistency, local links, shell syntax and quiet Compose validation can be checked without provisioning. They do not verify apt installation, systemd activation, GCP IAM/network behavior, e2-small memory/build capacity, certificate issuance, public smoke results or successful operator rollback. Record those results only after an authorized real execution. Current source tests and CI evidence remain distinct from cloud deployment evidence.
