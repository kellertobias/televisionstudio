import { AtemModule } from './atem'
import { ObsModule } from './obs'
import { SleepModule } from './sleep';
import { TextgenModule } from './textgen';
import { AudioModule } from './audio';
import { SystemStateModule } from './state';

import { BasicModule } from './basic-module'

export type ModuleNames = 'atem' | 'obs' | 'sleep' | 'text' | 'audio'
export type AnyModule = AtemModule | ObsModule | SleepModule | TextgenModule | AudioModule
export type iModules = {
    atem: AtemModule,
    obs: ObsModule,
    sleep: SleepModule,
    text: TextgenModule,
    audio: AudioModule,
    status: SystemStateModule,
}
    
export {
    AtemModule, ObsModule, SleepModule, TextgenModule, AudioModule, SystemStateModule, BasicModule
}