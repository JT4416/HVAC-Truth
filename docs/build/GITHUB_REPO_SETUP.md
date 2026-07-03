# GitHub Repository Setup for HVAC Truth

The app should move from ZIP packages into a GitHub repository now.

## Recommended repo name

```text
hvac-truth-app
```

## Recommended visibility

Use a private repository until the product is ready for public release.

## Recommended first commit

```bash
git init
git add .
git commit -m "Initial HVAC Truth MVP starter through V10"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hvac-truth-app.git
git push -u origin main
```

## What should not be committed

Do not commit:

```text
app/.env
node_modules/
.expo/
dist/
build/
```

Keep only:

```text
app/.env.example
```

## Suggested branch strategy for a one-person team

Keep it simple:

```text
main                 stable working version
feature/v11-claims   current feature branch
fix/<short-name>     bug fixes only when needed
```

## Next coding workflow

1. Create GitHub repo.
2. Push V10 starter as the initial baseline.
3. Create a new branch before V11.
4. Use GitHub issues or ClickUp tasks for feature tracking.
5. Tag meaningful milestones:

```bash
git tag v10-contractor-discovery
git push origin v10-contractor-discovery
```
