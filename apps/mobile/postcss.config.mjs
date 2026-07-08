// Tailwind v4 is compiled through PostCSS in Expo's Metro CSS pipeline;
// react-native-css (NativeWind v5) then turns the resulting CSS into RN styles.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
