# Release checklist

Release preparation and operational checks. A named maintainer can be
recorded here; permissions and service configuration need separate verification.

- [x] Name the maintainer: [@link108](https://github.com/link108), also in
      [CODEOWNERS](CODEOWNERS).
- [x] Verify `@link108` has repository permissions to review, merge and release
      (owner of the `agentevents-org` GitHub organization).
- [x] Record the project domain confirmed by the maintainer: `agent-events.dev`.
      Schema identifiers and the `dev.agent-events` / `dev.agent-events.x`
      event-type prefixes both use this domain.
- [ ] Decide where versioned schemas will be served. Repository schemas
      already support local/offline distribution.
- [x] Publish the maintainer-provided private security contact:
      `cameron@agent-events.dev` in [SECURITY.md](SECURITY.md).
- [x] Publish the private conduct-reporting contact:
      `cameron@agent-events.dev` in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- [x] Check remote CI passes after the draft changes are pushed.
