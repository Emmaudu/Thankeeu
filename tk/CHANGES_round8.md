# Round 8 - Priority A4 birthday, farewell, leaving and retirement covers

## Added assets

- Imported all 20 supplied birthday AVIF covers into:
  - `frontend/public/cards/priority/birthday`
- Imported all 20 supplied farewell/retirement AVIF covers into:
  - `frontend/public/cards/priority/farewell-retirement`

## Landing-page galleries

- Added a reusable, responsive A4 cover gallery component.
- Birthday page now shows the 20 new birthday covers.
- Farewell page now shows the 20 new farewell covers.
- Leaving-card page now shows the 20 new farewell/leaving covers in place of the old preview section.
- Retirement page now shows the 20 new farewell/retirement covers.
- Every landing-page gallery shows 10 covers at a time with Previous 10, page 1/page 2, and Next 10 controls.
- Selecting a design opens the album customizer with its occasion, design, and album layout preselected.

## Design priority

- Registered the new assets as full card-design records for birthday, leaving and retirement.
- Added the priority designs before the older generated and legacy designs in the general design library.
- The birthday, leaving and retirement filters now show the supplied covers first, followed by existing designs.
- The public and authenticated card creation wizards now use the first new birthday cover as their default design.
- The dedicated leaving-card catalogue shows the 20 new designs first, then the previous catalogue, with 10 designs per page.

## Verification

- Confirmed all 40 expected AVIF assets are present and non-empty.
- Confirmed landing-gallery links target `/card/customize` so design selections open directly in the editor.
- A production build could not be executed in this desktop session because Windows security blocked the bundled Node runtime as a potentially unwanted executable. The new JSX and imports were therefore checked directly in source, but the build should still be run in the normal project environment before deployment.
