# How to create and use the Design System

> **Performance test**: Verifying 20-worker parallel AI + push operations ⚡
> **Update 2**: Testing with GitHub Actions workflow access configured! 🏗️

## Component composition.

- When creating components that consists of several components, each component should be styled.
- Each components that is used to create a "composed" component should be styled, and remember to check if the component alread is styled.
- When creating a "composed component" evalute if it's really needed to create a composed component, or just document how to use the styled components.
  - MUI often has documentation on how to create composed components.

## Documentation and testing

- All components shall be documented and tested in Storybook before PR is created.

## RichInput height

Multiline fields grow with their content, and the page or dialog body scrolls; only the chat composer
scrolls inside itself ([multiline fields pattern](https://carasent.atlassian.net/wiki/spaces/ASMA/pages/2517467150/Multiline+fields+height+and+inner+scroll), MLF-1 to MLF-4).

| Prop                  | Caps            | Values                                                                                           |
| --------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `maxFieldHeight`      | the whole field | pixel number, CSS length (`'min(400px, 40dvh)'`), `'none'`, or `{ mobile?, tablet? }`             |
| `maxScrollableHeight` | the text alone  | legacy pixel number; omitted or `0` = 100px, `Infinity` = no cap; ignored with `maxFieldHeight` |

- **Chat composer:** `maxFieldHeight={{ mobile: 300, tablet: 400 }}`. Mobile is 0–743px and tablet is 744px and
  wider (the `asma-types` breakpoints); `tablet` falls back to `mobile`, and a missing `mobile` means no cap on
  mobile. The cap counts the reply header, attachment chips and toolbar. The field is never taller than the
  screen (`min(cap, 100dvh)`). The reply header and the attachment chips each take at most 30% of it before
  they scroll, so a long quote or many files never squeeze the text out.
- **Overflow cue:** while capped text overflows, the field shows a full scrollbar and fades the edge that hides
  text, so the cue also shows on touch devices, where scrollbars appear only while scrolling.
- **Every other editor:** `maxFieldHeight='none'`. The field grows with its content; the toolbar, or with the
  toolbar closed the format button, sticks to the bottom of the view while the field is in it. Sticky needs
  every ancestor between the field and the scrolling container to keep `overflow: visible` (or `clip`).
- **Display only:** `readOnly`, which always shows the full text and ignores both caps. `disabled` keeps the cap.
- `maxFieldHeight` needs the default styles; it has no effect with `noDefaultStyles`.

## Changelog

The project uses "changesets" to automatically bump version and create a changelog.

For each new feature or change run "npx changeset". Choose patch for a change or bug fix, minor for a new feature or major version for a breaking change. This creates a markdown file in .changeset folder. Commit to brach/PR as normal.

A PR can have several changesets.

The pipeline will automatically bump version and create changelog after merge to master.

## Index file

- Index files shall not be edited manually.
- ctix is used for automatically create index files for exporting componens. Run "npm run create-index"
- 'src/styles/index.ccss' is imported to 'src/theme/customMuiColors.ts' so exporting works with ctix.

## Using MUI theme in App

```tsx
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { defaultTheme, customPalettes } from 'asma-ui-richeditor';

const dataTheme = window.document.body.attributes.getNamedItem('data-theme');

const getTheme = () => {
  switch (dataTheme?.value) {
    case 'fretex':
      return customPalettes.fretex.primary;
    default:
      return null;
  }
};

const theme = createTheme(defaultTheme, {
  palette: {
    ...defaultTheme.palette,
    primary: {
      ...getTheme(),
    },
    role: customPalettes.role,
  },
});

<React.Fragment>
  <ThemeProvider theme={createMuiTheme(theme)}>
    <... />
  </ThemeProvider>
</React.Fragment>
```

## Using Components in App

```tsx
import { StyledButton } from 'asma-ui-richeditor';

...

<>
  <StyledButton>
    Text
  </StyledButton>
</>
```
