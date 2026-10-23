import { addons } from '@/addons.generated';
import CoreHome from '@/features/home/home.screen';

/** The core Home, unless an add-on brings its own (docs/addons.md). */
export default addons.find((addon) => addon.homeScreen)?.homeScreen ?? CoreHome;
