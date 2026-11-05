# XLEAP Two-Color Timing Laboratory

A standalone educational explorer of the relative arrival times of two soft-X-ray pulses and a selected electron slice. Based on `XLEAP_Two_Color_Timing_Lab_v3(1).html` uploaded 4 November 2026, with publication interface revision 3.1.

## Launch

Open `index.html` directly in a modern browser. No installation, server, account, CDN, private data or API key is required. All CSS, JavaScript and SVG plot generation are inline. The official SLAC logo is bundled locally in `assets/`; keep that folder beside `index.html`. External links open scientific references; calculations make no network requests. Settings are retained in browser-local storage when available.

Public hosted URL:
https://fede-science-games.fedefirefox.chatgpt.site/xleap-timing-lab/

## Physics and signs

All arrival times refer to a common downstream plane, with the selected downstream electron slice set to zero. Positive time means later arrival. Let Δ21 = t2 − t1, D be the extra electron delay in the magnetic chicane, and O the extra optical delay of SXR1 in the interstage SXRDD after U1. Then:

- Δ21 = Δ0 + D − O.
- SXRDD adds +O to SXR1 relative to electrons, leaves SXR2 relative to electrons unchanged, and subtracts O from SXR2−SXR1.
- A chicane delay increases Δ21 by D. In the moving electron reference used here, SXR1 moves earlier by D while the conditional SXR2 coordinate is unchanged.
- Negative Δ21 means SXR2 arrives first. Labels identify generation stages, not temporal ordering.

For 87 undulator periods per module, free-space photon/electron slippage is s(E) = 87 h/E, with h = 4.135667696 eV fs. Define S1 = 9 s(E1), S2 = N2 s(E2). The group-velocity parameter is vg ≈ ve[1 + α λr/λu].

### Harmonic mode, ω / 2ω

E2 = 2 E1. Harmonic microbunching seeds the downstream pulse from the same XLEAP spike; no fresh-slice scheme is assumed.

Δ0 = t0(E1) + (1 − α2) S2, with α2 = 0.73.

Guo et al. measured α2 = 0.73 ± 0.04 and a delay slope of 130 ± 19 as/module at 740 eV. The model gives 131.28 as/module at that energy. Applying a constant α2 across other energies is an extrapolation. The implementation chooses t0 = clamp[0.3 − (E1 − 260) × 0.2/240, 0.05, 0.35] fs. This interpolation is illustrative, not a measured calibration or exact digitization of the supplementary simulations.

### Independently tuned mode, ω1 / ω2

Both energies can be selected, in either order. The same-current-spike hypothesis is retained; independent tuning does not imply fresh-slice generation or guarantee adequate gain in both stages.

Δ0 = 10 fs + α1(S1 − S1,ref) + (1 − α2)(S2 − S2,ref), with α1 = α2 = 1/3.

The reference is E1 = 530 eV, E2 = 430 eV, N2 = 1. The ~10 fs value is a published TMO operating minimum for arbitrary wavelengths. Assigning it to this precise reference point and extrapolating with 1D gain-theory slopes are model choices, not measured machine performance.

### Electron-relative coordinates

The conditional convention is t2 = −α2 S2 and t1 = t2 − Δ21. This assumes a selected SXR2 birth reference at U2 entrance. Absolute X-ray/electron coordinates are not experimentally calibrated. The timing table checks the SXRDD identity at the current energies, module count and chicane setting.

## Controls and outputs

| Control | Meaning |
| --- | --- |
| ω / 2ω or ω1 / ω2 | Harmonic locking or independent energies |
| E1, E2 | Photon energies; E2 is locked in harmonic mode |
| U2 modules | 1–12; harmonic counts above four are extrapolations |
| Magnetic chicane | D = 0–30 fs on slider, up to 1000 fs numerically |
| SXRDD switch and value | Enable O = 0–15 fs; this is an illustrative model limit |
| Presets | 365/730, 530/430, 510/535 eV; preserve the current optical-delay setting |
| Reset | Restore harmonic 365/730 eV, four U2 modules, D = 0, SXRDD off |
| Export plot | Download arrival-time SVG |
| N2 sweep CSV | Download modeled timing for all 12 U2 counts |
| Settings JSON | Download inputs, outputs and model assumptions |

Mobile users can expand Settings. Timing plots and the budget table scroll horizontally on narrow displays. Reset and SVG export remain visible on mobile. Keyboard focus and the Settings expanded state are exposed for accessibility.

## Assumptions and limits

- Reduced-order kinematics, not a self-consistent FEL, transport, gain or wave-optics simulation.
- Fixed 5 GeV beam, nine U1 modules, 39 mm undulator period, 87 periods/module. Undulator length is approximately 3.4 m.
- The K warning combines an engineering minimum of 1.24 and an approximately 5.77 value described in Guo's setup; it is only a plausibility screen.
- No prediction of pulse energy, microbunching loss, energy-spread growth, optical transmission, jitter, focusing, damage, dispersion or nonlinear centroid shifts.
- The ±0.04 uncertainty on harmonic α2 is cited but not propagated into uncertainty bands.
- Pulse envelopes and their widths are illustrative. Long-delay plots broaden narrow envelopes for visibility; centroids remain on the plotted time axis.
- Large D can destroy harmonic bunching. Independent-color gain may be degraded by U1. A numerical setting is not evidence the facility can deliver it.
- The 15 fs SXRDD limit is a chosen exploration range, not a verified specification of an installed device. Its location is schematic and its timing contribution follows the specified interstage geometry.
- TMO's Run-27 page lists 250–1800 eV in its overview and 200–2000 eV in its table. The app uses the latter for advisory warnings, not a guaranteed operating envelope.

## References and verification scope

Reviewed 5 November 2026 against primary sources:

1. Z. Guo et al., *Experimental demonstration of attosecond pump-probe spectroscopy with an X-ray free-electron laser*, Nature Photonics **18**, 691–697 (2024), [DOI](https://doi.org/10.1038/s41566-024-01419-w), [full preprint including supplementary material](https://arxiv.org/html/2401.15250). Supports the measured harmonic coefficient/slopes and the discussion of wavelength-dependent generation offsets; does not make this app's offset interpolation a calibration.
2. [LCLS TMO standard configurations](https://lcls.slac.stanford.edu/instruments/tmo/standard-configurations). Gives approximate minimum separations of 300 as for harmonic operation and 10 fs for arbitrary wavelengths. These are configuration-dependent operating descriptions.
3. M. Leitner et al., [IPAC2017 TUPAB123](https://doi.org/10.18429/JACoW-IPAC2017-TUPAB123), Table 1. Supports 39 mm period, 87 periods, ~3.4 m segment length and the 1.24 minimum K.
4. K. K. Alaa El-Din et al., [Scientific Reports **14**, 7267 (2024)](https://doi.org/10.1038/s41598-024-56782-z). Studies machine-learning prediction of photon energies in two-color data; it is not an independent timing validation.

## Tests

Run `node tests/timing.test.cjs` from this folder. Uses Node's standard library, with no package installation. Checks both modes, both energy orderings, optical/chicane signs, the timing identity, the reference anchor, the measured-slope range and input limits.

The application retains its live SXRDD before/after consistency check. Passing algebraic checks does not validate the physical approximations.

## License and branding

Original code, tests and documentation use the [MIT License](LICENSE). The official, unchanged SLAC logo and all institutional trademarks are explicitly excluded: see [NOTICE.md](NOTICE.md). The owner approved use of the logo for this educational release. The footer links to official SLAC and LCLS resources without claiming institutional endorsement. See [BRANDING.md](BRANDING.md) for artwork provenance and display rules.
