# V10 Local Import Instructions

The GitHub connector confirmed write access and committed repository housekeeping files, but the connector available in this chat cannot perform a true local `git push` of the full V10 folder or upload the local ZIP as a source tree.

Use these steps to import the full V10 package from your machine.

## 1. Download and unzip V10

Download the latest V10 package from the ChatGPT artifact link and unzip it locally.

## 2. Clone the GitHub repo

```powershell
git clone https://github.com/JT4416/HVAC-Truth.git
cd HVAC-Truth
```

## 3. Copy the V10 package contents into the repo

Copy the contents of the unzipped V10 folder into the repo root so these folders/files sit at the top level:

```text
app/
backend/
docs/
README.md
```

Do not copy `node_modules`, `.expo`, `.env`, `dist`, or `build` folders.

## 4. Confirm ignored files

The repo already includes `.gitignore` entries for:

```text
node_modules/
.expo/
dist/
build/
.env
app/.env
```

## 5. Commit and push

```powershell
git status
git add app backend docs README.md .gitignore
git commit -m "Add HVAC Truth MVP through V10"
git push origin main
```

## 6. Verify

After pushing, verify that GitHub shows:

```text
app/src/
backend/supabase/
docs/features/
docs/build/
```

Once those folders are visible in GitHub, the repo is the master source for the HVAC Truth app.
