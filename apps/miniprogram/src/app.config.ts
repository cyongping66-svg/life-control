export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/ask/index',
    'pages/finance/index',
    'pages/career/index',
    'pages/social/index',
    'pages/reminders/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f4f3ec',
    navigationBarTitleText: '人生浪费指南',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#708078',
    selectedColor: '#155d42',
    backgroundColor: '#ffffff',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/ask/index', text: '问一问' },
      { pagePath: 'pages/finance/index', text: '财务' },
      { pagePath: 'pages/career/index', text: '职业' },
      { pagePath: 'pages/social/index', text: '社交' },
    ],
  },
});
