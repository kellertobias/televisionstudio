import { BasicInterface } from './../basic-interface';
import { ConfigBackend } from '../../engine/config';
import { IModules } from '../../modules';
import { MacroEngine } from '../../engine/macros';

export abstract class DeskKeyboardInterfaceHelpers extends BasicInterface {
	constructor(config: ConfigBackend, modules: IModules, macros: MacroEngine) {
		super(config, modules, macros);
	}

	protected mapColToChannel(col: number, shift: boolean) {
		if (shift) col = col + 8;
		switch (col) {
			case 0:
			case 1:
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:
			case 7:
				return `CH${col + 1}`;
			case 8:
			case 9:
				return `MP${col - 7}`;
			case 10:
			case 11:
				return `MP${col - 9}K`;
			case 12:
			case 13:
				return `COL${col - 11}`;
			case 14:
				return 'BARS';
			case 15:
				return 'BLACK';

			default:
				return 'BLACK';
		}
	}

	protected mapChannelToCol(channel: string) {
		switch (channel) {
			case 'CH1':
				return 0;
			case 'CH2':
				return 1;
			case 'CH3':
				return 2;
			case 'CH4':
				return 3;
			case 'CH5':
				return 4;
			case 'CH6':
				return 5;
			case 'CH7':
				return 6;
			case 'CH8':
				return 7;
			case 'MP1':
				return 8;
			case 'MP2':
				return 9;
			case 'MP1K':
				return 10;
			case 'MP2K':
				return 11;
			case 'COL1':
				return 12;
			case 'COL2':
				return 13;
			case 'BARS':
				return 14;
			case 'BLACK':
				return 15;
			default:
				return 15;
		}
	}
}
