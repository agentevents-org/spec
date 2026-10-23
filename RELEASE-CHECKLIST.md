# Release checklist

Release preparation and operational checks. A named maintainer can be
recorded here; permissions and service configuration need separate verification.

- [x] Name the maintainer: [@link108](https://github.com/link108), also in
      [CODEOWNERS](CODEOWNERS).
- [ ] Verify `@link108` has repository permissions to review, merge and release.
- [x] Record the project domain confirmed by the maintainer: `agent-events.dev`.
      Schema identifiers use this domain; event-type namespaces retain
      `dev.agentevents` and `dev.agenteventsx` as vocabulary identifiers.
- [ ] Decide where versioned schemas will be served. Repository schemas
      already support local/offline distribution.
- [x] Publish the maintainer-provided private security contact:
      `cameron@agent-events.dev` in [SECURITY.md](SECURITY.md).
- [x] Publish the private conduct-reporting contact:
      `cameron@agent-events.dev` in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- [ ] Check remote CI passes after the draft changes are pushed.
