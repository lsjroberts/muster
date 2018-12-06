import { ContainerComponent } from '@dws/muster-react';
import { AppView } from './app';
import { AppContainer } from './app.container';

export const App: ContainerComponent = AppContainer(AppView);
