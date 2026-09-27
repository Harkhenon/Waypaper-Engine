import {
  createTheme,
  DEFAULT_THEME,
  mergeMantineTheme,
  type MantineColorsTuple
} from '@mantine/core'

const anthracite: MantineColorsTuple = [
  '#e8eaec',
  '#c2c6cb',
  '#9ba1a8',
  '#747c86',
  '#535a63',
  '#3d434a',
  '#33383e',
  '#2b2f31',
  '#232627',
  '#1a1c1e'
]

export const theme = createTheme({
  ...mergeMantineTheme(DEFAULT_THEME, {
    colors: {
      anthracite,
      dark: anthracite
    },
    primaryColor: 'anthracite',
    primaryShade: { light: 6, dark: 7 },
    defaultGradient: { from: 'anthracite.5', to: 'anthracite.3', deg: 45 },
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    radius: {
      xs: '4px',
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    },
    headings: { fontWeight: '600' },
    components: {
      Button: {
        defaultProps: { radius: 'md' }
      },
      Card: {
        defaultProps: { radius: 'lg', bg: 'anthracite.6' }
      },
      Paper: {
        defaultProps: { radius: 'md', bg: 'anthracite.7' }
      },
      Tooltip: {
        defaultProps: { bg: 'anthracite.9', c: 'anthracite.0', radius: 'sm' }
      }
    }
  })
})

export default theme
