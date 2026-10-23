import { Blocks, Inbox, LayoutGrid, SquareCheckBig } from 'lucide-react-native';
import { k } from '@pkg/locales';
import type { MobileAddon } from '@/shared/addon';
import { TabBar } from './mobile-demo/components/tab-bar';
import HomeScreen from './mobile-demo/screens/home.screen';

/**
 * The demo add-on's part of the app: a task tracker on sample data (Home,
 * Tasks, Inbox, a task, a new task), the component showcase and the
 * ready-made blocks. A new project never keeps it (docs/addons.md).
 */
export const addon: MobileAddon = {
  tabs: [
    { name: 'tasks', titleKey: k.demo.app.tasks, icon: SquareCheckBig },
    { name: 'inbox', titleKey: k.demo.app.inbox, icon: Inbox },
  ],
  screens: [
    { name: 'task/[id]' },
    { name: 'new-task', modal: true },
    { name: 'showcase/index' },
    { name: 'showcase/[id]' },
    { name: 'blocks/index' },
    { name: 'blocks/[id]' },
  ],
  links: [
    {
      titleKey: k.demo.app.showcase,
      descriptionKey: k.demo.app.showcaseBody,
      href: '/showcase',
      icon: LayoutGrid,
    },
    {
      titleKey: k.demo.app.blocks,
      descriptionKey: k.demo.app.blocksBody,
      href: '/blocks',
      icon: Blocks,
    },
  ],
  tabBar: (props) => <TabBar {...props} />,
  homeScreen: HomeScreen,
};
