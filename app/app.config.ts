export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'indigo',
      neutral: 'zinc'
    },
    button: {
      slots: {
        base: 'rounded-lg cursor-pointer transition-[color,background-color,box-shadow,opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]'
      }
    },
    card: {
      slots: {
        root: 'rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_36px_rgba(0,0,0,0.04)]'
      }
    },
    modal: {
      slots: {
        content: 'rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.18)]'
      }
    }
  }
})
