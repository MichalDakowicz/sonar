# Update notes schema

Rules for writing `UPDATE.md`. Read this before editing that file.

## What UPDATE.md is for

`UPDATE.md` is the running draft of user-facing release notes. Every user-visible change
gets a line there **as it lands**, not reconstructed from git log at release time.

At release, the top section's body is pasted into the GitHub release body. So these notes
end up in front of a user, not in internal bookkeeping — the schema below is bound by how
much fits on a phone screen.

## File layout

One section per version, newest first. The top section is always the unreleased one.

```
## 3.1.0 — Unreleased

### Added
- ...

## 3.0.0 — 2026-09-04

### Added
- ...
```

Version heading: `## <version> — <YYYY-MM-DD>`, or `## <version> — Unreleased` while in
progress. The version matches `expo.version` in `app.json` and the git tag `v<version>`.

## Categories

Use only these, in this order. Omit any that are empty — never leave an empty heading.

| Heading       | For                                                        |
| ------------- | ---------------------------------------------------------- |
| `### Added`   | New capability the user did not have before                 |
| `### Changed` | Existing behaviour that now works differently               |
| `### Fixed`   | Something that was broken and now is not                    |
| `### Removed` | Capability that is gone                                     |

## Entry rules

- One `- ` bullet per change. One change per bullet — split "and also" lines.
- Write for a user of the app, not a reviewer of the diff. Say what they can now do, not
  which files moved.
- Present tense, no trailing period, sentence case.
- Name the surface when it helps locate the change: Collection, Discover, Stats, Social,
  Profile, Settings, album detail, History.
- Keep a bullet to roughly one phone line (~90 chars). Longer detail belongs on the
  GitHub release page.
- **Skip internal-only work**: refactors, dependency bumps, tests, CI, lint config, build
  tooling, type fixes with no behaviour change. If a user cannot notice it, it is not an
  update note.

Good:

```
- Rate an album you do not own — the score sticks to the release, not to your copy
- Collection can group by artist, year, genre, format or status
```

Bad:

```
- Added useCollectionFilters hook and CollectionGroups component   (implementation, not user value)
- Various fixes and improvements                                   (says nothing)
```

## Budget

Roughly 12 bullets per release. If a release has more, the ones that survive are the ones
a user would notice on opening the app.
