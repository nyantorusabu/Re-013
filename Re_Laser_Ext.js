// Name: Re:Laser
// ID: ReLaserExt
// Description: Re:Laser専用の拡張機能。Re:Laser以外で使用することは想定されていません。
// By: nyantorusabu

(async function (Scratch) {
	'use strict';

	// 変数定義
	const AddonOption = {
		NYADDON: {
			System: {
				ID: {
					text: 'ユーザーめい',
					type: 'input',
					default: 'Guest',
				},
			},
			Touch: {
				isActive: {
					text: 'タップそうさ',
					type: 'boolean',
					default: false,
				},
				Type: {
					text: 'タイプ',
					type: 'list',
					list: ['1', '2'],
					default: '1',
				},
			},
		},
	};
	const Mods = [];
	const Addons = [];
	const AddonSprite = {};
	const ChartUser = {};
	const HScore = {};
	const Var = {};

	let Setup = false;
	let Loaded = false;
	const PressKeys = [];
	const PressingKeys = [];

	const ChartStore = [];

	window.NYADDON = {};
	NYADDON.Option = AddonOption;
	NYADDON.SetOption = _SetOption;

	// ライブラリ読み込みとかその辺の関数
	async function Extension_Setup() {
		const loadNDT = () => {
			if (window.NDT) return Promise.resolve();
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src =
					'https://nyantorusabu.github.io/NDT/NekoDevTools.js';
				script.onload = resolve;
				script.onerror = reject;
				document.body.appendChild(script);
			});
		};
		const loadfflate = () => {
			if (window.fflate) return Promise.resolve();
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = 'https://unpkg.com/fflate@0.8.2';
				script.onload = resolve;
				script.onerror = reject;
				document.body.appendChild(script);
			});
		};

		await loadNDT();
		await loadfflate();

		NDT.NEve.Add('FLAG_BEFORE', () => {
			if (!Loaded) return;
			NDT.VM.postIOData('keyboard', {
				key: ' ',
				isDown: true,
			});
		});
		NDT.NEve.Add('FLAG_AFTER', () => {
			Loaded = true;
		});
		NDT.NEve.Add('STEP_BEFORE', () => {
			if (PressingKeys.length > 0) {
				for (const now of PressingKeys) {
					NDT.VM.postIOData('keyboard', {
						key: now,
						isDown: true,
					});
				}
			}
		});
		NDT.NEve.Add('STEP_AFTER', () => {
			if (PressingKeys.length > 0) {
				for (const now of PressingKeys) {
					NDT.VM.postIOData('keyboard', {
						key: now,
						isDown: false,
					});
				}
				PressingKeys.length = 0;
			}
			if (PressKeys.length > 0) {
				PressingKeys.push(...PressKeys);
				PressKeys.length = 0;
			}
		});
		NDT.NEve.Add('NYADDON_SETUP', async () => {
			await _Setup();
			NDT.Eve.Flag();
		});
	}

	class ReLaserExt {
		getInfo() {
			return GenerateBlocksInfo(
				'ReLaserExt',
				'Re:Laser',
				blocks(
					label('仮変数'),
					block(
						'Var_Get',
						'R',
						'仮変数 [VarID]',
						arg('VarID', 'S', 'r1'),
					),
					block(
						'Var_Set',
						'C',
						'仮変数 [VarID] を [Value] にする',
						args(arg('VarID', 'S', 'r1'), arg('Value', 'S', '0')),
					),
					block(
						'Var_Change',
						'C',
						'仮変数 [VarID] を [Value] ずつ変える',
						args(arg('VarID', 'S', 'r1'), arg('Value', 'S', '1')),
					),
					label('システム'),
					block('Setup', 'C', '初期設定'),
					block('Reload', 'C', 'Re:LASERをリロード'),
					label('譜面関係'),
					block('GetAllChart', 'R', 'すべての譜面'),
					block(
						'GetChartFrom',
						'R',
						'譜面 [ChaID] の制作者',
						arg('ChaID', 'S', 'ライアーダンサー'),
					),
					block(
						'ImportFromScratch',
						'C',
						'PJID [ID] から譜面をインポート',
						arg('ID', 'N', '963833303'),
					),
					block(
						'ImportFromZIP',
						'C',
						'ProjectURL [URL] から譜面をインポート',
						arg(
							'URL',
							'S',
							'https://nyantorusabu.github.io/Re-013/NYADDON.sb3',
						),
					),
					block('DeleteAllChart', 'C', 'すべての譜面/アセットを削除'),
					block(
						'DeleteChart',
						'C',
						'譜面 [ID] と関連するアセットを削除',
						arg('ID', 'S', 'ライアーダンサー'),
					),
					block(
						'SetCStore',
						'C',
						'スタジオID [ID] から譜面を取得',
						arg('ID', 'N', '26812335'),
					),
					block(
						'isCStoreLoaded',
						'B',
						'読み込み済みのコミュニティ譜面がある',
					),
					block('CStorelength', 'R', 'コミュニティ譜面の数'),
					block(
						'GetCStoreChart',
						'R',
						'[POS] 番目のコミュニティ譜面の [TYPE]',
						args(arg('POS', 'N', '1'), arg('TYPE', 'S', 'id')),
					),
					label('Mod関係'),
					block('GetAllMod', 'R', 'すべてのMod'),
					label('外部アドオン関係'),
					block(
						'InstallAddon',
						'C',
						'[URL] から外部アドオンをインストール',
						arg(
							'URL',
							'S',
							'https://nyantorusabu.github.io/Re-013/Sprites/Addon/Re_BEAT.sprite3',
						),
					),
					block(
						'UninstallAddon',
						'C',
						'アドオンID [ID] のアドオンをアンインストール',
						arg('ID', 'S'),
					),
					block(
						'SetAddonActive',
						'C',
						'アドオンID [ID] のアドオンの有効化を [Active] にする',
						args(arg('ID', 'S'), arg('Active', 'N', '0')),
					),
					block('GetAddonLength', 'R', '外部アドオンの数'),
					block(
						'GetAddonData',
						'R',
						'[Pos] 番目の外部アドオンの [Type]',
						args(arg('Pos', 'N', '1'), arg('Type', 'S', 'id')),
					),
					label('OPTION関係'),
					block('SaveOption', 'C', 'REOPTIONを保存'),
					block(
						'SetNYADDONOption',
						'C',
						'アドオン [ID] のスペース [Space] のキー [Key] の値を [Value] にする',
						args(
							arg('ID', 'S'),
							arg('Space', 'S'),
							arg('Key', 'S'),
							arg('Value', 'S'),
						),
					),
					block(
						'GetNYADDONOptionValue',
						'R',
						'アドオン [ID] のスペース [Space] のキー [Key] の値',
						args(
							arg('ID', 'S'),
							arg('Space', 'S'),
							arg('Key', 'S'),
						),
					),
					block(
						'GetNYADDONOptionData',
						'R',
						'アドオン [ID] のスペース [Space] のキー [Key] の要素 [Type]',
						args(
							arg('ID', 'S'),
							arg('Space', 'S'),
							arg('Key', 'S'),
							arg('Type', 'S'),
						),
					),
					block(
						'GetNYADDONOptionList',
						'R',
						'アドオン [ID] のスペース [Space] のキー [Key] のリストの [POS] 番目',
						args(
							arg('ID', 'S'),
							arg('Space', 'S'),
							arg('Key', 'S'),
							arg('POS', 'N'),
						),
					),
					block(
						'GetNYADDONOptionlength',
						'R',
						'アドオン [ID] のスペース [Space] のキー [Key] の要素 [Type] の書いている所までの長さ',
						args(
							arg('ID', 'S'),
							arg('Space', 'S'),
							arg('Key', 'S'),
							arg('Type', 'S'),
						),
					),
					block(
						'GetNYADDONOptionPos',
						'R',
						'アドオン [ID] のスペース [Space] のキー [Key] の書いている所までの [POS] 番目のキー',
						args(
							arg('ID', 'S'),
							arg('Space', 'S'),
							arg('Key', 'S'),
							arg('POS', 'N'),
						),
					),
					label('スコア'),
					block(
						'GChartID',
						'R',
						'曲名 [MusID] と難易度 [DifID] で譜面IDを生成',
						args(
							arg('MusID', 'S', 'ライアーダンサー'),
							arg('DifID', 'S', 'hard'),
						),
					),
					block(
						'GetHscore',
						'R',
						'譜面ID [ChaID] のハイスコア',
						arg('ChaID', 's', 'ライアーダンサー_hard'),
					),
					block(
						'UpdateHscore',
						'C',
						'譜面ID [ChaID] のハイスコアを [Score] で更新',
						args(
							arg('ChaID', 'S', 'ライアーダンサー_hard'),
							arg('Score', 'N', '1000000'),
						),
					),
					block(
						'GetRank',
						'R',
						'スコア [Score] をランクに変換',
						arg('Score', 'N', '1000000'),
					),
					label('mainスプライト'),
					block(
						'GAMEor',
						'B',
						'GAME. [main] [sub]',
						args(
							arg('main', 's', 'menu'),
							arg('sub', 's', 'senkyoku_wait_choice'),
						),
					),
					block('NABP', 'R', 'NYADDONボタンx座標'),
					block(
						'Dif_X',
						'R',
						'難易度の [POS] 番目のx座標',
						arg('POS', 'N', '1'),
					),
					block(
						'Dif_Y',
						'R',
						'難易度の [POS] 番目のy座標',
						arg('POS', 'N', '1'),
					),
					block('Dif_Length', 'R', '難易度の長さ'),
					block(
						'Dif_ID',
						'R',
						'難易度の [POS] 番目の難易度名',
						arg('POS', 'N', '1'),
					),
					block(
						'isDif',
						'B',
						'難易度の [POS] 番目を選択している',
						arg('POS', 'N', '1'),
					),
					block('PLA_UI_Col', 'R', 'PLAYER.UI.Color'),
					block(
						'mainVarList',
						'R',
						'mainスプライトのすべてのローカル変数',
					),
					block(
						'mainVarGet',
						'R',
						'mainスプライトのローカル変数 [VarID]',
						arg('VarID', 'S', 'GAME.main'),
					),
					block(
						'mainVarSet',
						'C',
						'mainスプライトのローカル変数 [VarID] を [Value] にする',
						args(
							arg('VarID', 'S', 'GAME.main'),
							arg('Value', 'S', 'menu'),
						),
					),
					block(
						'mainListList',
						'R',
						'mainスプライトのすべてのローカルリスト',
					),
					block(
						'mainListGet',
						'R',
						'mainスプライトのローカルリスト [VarID] のArray',
						arg('VarID', 'S', 'UI.button'),
					),
					block(
						'mainListSet',
						'C',
						'mainスプライトのローカルリスト [VarID] を [Value] で置き換え',
						args(
							arg('VarID', 'S', 'UI.button'),
							arg('Value', 'S', '["りんご", "ごりら", "らっぱ"]'),
						),
					),
					block(
						'showPrompt',
						'R',
						'[PROMPT] と聞く',
						arg('PROMPT', 'S', '猫は好きですか?'),
					),
					label('NDT'),
					block('NDTVer', 'R', 'NDTのバージョン'),
					block('NDTMessage', 'R', 'NDTの更新内容'),
					block(
						'Upload',
						'R',
						'[TYPE] のアップロードを求める',
						arg('TYPE', 'S', '.naddon'),
					),
					block(
						'LoadImage',
						'C',
						'スプライト [SPRITE] にURL [URL] から画像を読み込んで [ID] として保存',
						args(
							arg('SPRITE', 'S', 'main'),
							arg(
								'URL',
								'S',
								'https://trampoline.turbowarp.org/avatars/95456441',
							),
							arg('ID', 'S', 'cstore.user.95456441'),
						),
					),
					block(
						'isCostumeLoaded',
						'B',
						'スプライト [SPRITE] が画像 [ID] を読み込み済み',
						args(
							arg('SPRITE', 'S', 'main'),
							arg('ID', 'S', 'cstore.user.95456441'),
						),
					),
					block(
						'CostumeSize',
						'R',
						'スプライト [SPRITE] の画像 [ID] の横幅',
						args(
							arg('SPRITE', 'S', 'main'),
							arg('ID', 'S', 'cstore.user.95456441'),
						),
					),

					block(
						'CostumeURL',
						'R',
						'スプライト [SPRITE] の画像 [ID] のURLを取得',
						args(
							arg('SPRITE', 'S', 'main'),
							arg('ID', 'S', 'cstore.user.95456441'),
						),
					),
					label('その他'),
					block(
						'PressSCKey',
						'C',
						'[KEY] を1STEP押す',
						arg('KEY', 'S', 'd'),
					),
					block(
						'isTouching',
						'B',
						'スプライトにいずれかの手が触れている',
					),
					block(
						'StartsW',
						'R',
						'[JSON] の中で [TEXT] から始まるすべての要素',
						args(
							arg('JSON', 'S', '["りんご", "ごりら", "らっぱ"]'),
							arg('TEXT', 'S', 'ご'),
						),
					),
					block(
						'tTot',
						'R',
						'[TEXT] の [F] 文字目から [T] 文字目までの文',
						args(
							arg('TEXT', 'S', 'ねこです'),
							arg('F', 'N', '2'),
							arg('T', 'N', '3'),
						),
					),
				),
				{
					menuIconURI:
						'https://nyantorusabu.github.io/Re-013/Asset/NA/menu.png',
					blockIconURI:
						'https://nyantorusabu.github.io/Re-013/Asset/NA/block.png',
					color1: '#ffad87',
					color2: '#ff9c6e',
					color3: '#ff8a54',
				},
			);
		}

		// ブロックの定義
		// システム
		Reload() {
			_Reload();
		}
		Setup() {
			if (Setup) return;

			NDT.NEve.Dispatch('NYADDON_SETUP');
			NDT.Eve.Stop();
		}
		// 仮変数
		Var_Get(args) {
			return Var[args.VarID];
		}
		Var_Set(args) {
			Var[args.VarID] = args.Value;
		}
		Var_Change(args) {
			if (isNaN(Var[args.VarID])) {
				Var[args.VarID] = 0;
			}
			if (!isNaN(args.Value)) {
				Var[args.VarID] = Number(Var[args.VarID]) + Number(args.Value);
			}
		}
		// 譜面
		GetAllChart() {
			return _AllChart();
		}
		GetChartFrom(args) {
			if (!Object.keys(ChartUser).includes(args.ChaID)) return 'ZVA6';
			return ChartUser[args.ChaID];
		}
		DeleteAllChart() {
			for (const now of NDT.Spr.Ast.Sou.IDList('MUSIC')) {
				if (NDT.Spr.Ast.Sou.NameList('MUSIC').includes(now)) {
					NDT.Spr.Ast.Sou.Delete('MUSIC', now);
				}
				if (Mods.filter((m) => m.chart == now).length > 0) {
					NDT.Spr.Delete(
						Mods.filter((m) => m.chart == now)[0].sprite,
					);
				}
			}
			NDT.List.Get('譜面データ/charts').length = 0;
		}
		DeleteChart(args) {
			const ID = args.ID;
			if (!_AllChart().includes(ID)) return;
			if (Mods.filter((m) => m.chart == ID).length > 0) {
				NDT.Spr.Delete(Mods.filter((m) => m.chart == ID)[0].sprite);
			}
			if (NDT.Spr.Ast.Mus.NameList('MUSIC').includes(ID)) {
				NDT.Spr.Ast.Mus.Delete('MUSIC', ID);
			}
			const index = _ChartData().findIndex((c) => c.startsWith(`#${ID}`));
			_ChartData().splice(index, 1);
			while (
				!(
					_ChartData().length - 1 < index ||
					_ChartData()[index].startsWith('#')
				)
			) {
				_ChartData().splice(index, 1);
			}
		}
		async ImportFromScratch(args) {
			await _ImportChart('SC', args.ID);
		}
		async ImportFromZIP(args) {
			await _ImportChart('ZIP', args.URL);
		}
		async SetCStore(args) {
			ChartStore.length = 0;
			const List = [];
			const Del = [1156261781, 388537072];
			let P = 0;
			while (true) {
				const res = await fetch(
					`https://trampoline.turbowarp.org/api/studios/${args.ID}/projects?limit=40&offset=${P * 40}`,
				);
				const data = await res.json();
				for (const now of data) {
					if (Del.includes(now.id)) continue;
					const Cha = {};
					Cha.id = now.id;
					Cha.title = now.title
						.replaceAll('音ゲー', '')
						.replaceAll('：', '')
						.replaceAll(':', '::')
						.replaceAll('ZERONEIII', '')
						.replaceAll('ZERONEⅢ', '')
						.replaceAll('ZERONE', '')
						.replaceAll('ReLASER', '')
						.replaceAll('[]', '')
						.trim();
					Cha.user = now.username;
					Cha.PJImage = `https://trampoline.turbowarp.org/thumbnails/${now.id}?width=240&height=180`;
					Cha.USERImage = `https://trampoline.turbowarp.org/avatars/${now.creator_id}?width=32&height=32`;
					List.push(Cha);
				}
				if (data.length < 40) {
					ChartStore.push(...List);
					return;
				}
				P += 1;
			}
		}
		isCStoreLoaded() {
			return ChartStore.length > 0;
		}
		CStorelength() {
			return ChartStore.length;
		}
		GetCStoreChart(args) {
			return String(ChartStore[args.POS - 1]?.[args.TYPE]);
		}
		// Mod
		GetAllMod() {
			return JSON.stringify(Mods);
		}
		// 外部アドオン
		async InstallAddon(args) {
			const MFest = await _InstallAddon(args.URL);
			if (Addons.filter((a) => a.id == MFest.id).length > 0) {
				const Index = Addons.findIndex((a) => a.id == MFest.id);
				Addons.splice(Index, 1);
			}
			MFest.active = true;
			Addons.push(MFest);
			await NS.Set(`re_addon_${MFest.id}`, args.URL);
			localStorage.setItem('re_addon', JSON.stringify(Addons));
			if (!MFest.reload) NDT.Spr.Eve.Flag(AddonSprite[MFest.id]);
		}
		async UninstallAddon(args) {
			_UninstallAddon(args.ID);
			const Index = Addons.findIndex((a) => a.id == args.ID);
			Addons.splice(Index, 1);
			await NS.Delete(`re_addon_${args.ID}`);
			localStorage.setItem('re_addon', JSON.stringify(Addons));
		}
		async SetAddonActive(args) {
			const AD = Addons.filter((a) => a.id == args.ID)[0];
			if (!AD || AD.active == (args.Active == 1)) return;
			if (args.Active == 1) {
				AD.active = true;
				const ADURL = await NS.Get(`re_addon_${AD.id}`);
				await _InstallAddon(ADURL);
			} else {
				AD.active = false;
				await _UninstallAddon(AD.id);
			}
			localStorage.setItem('re_addon', JSON.stringify(Addons));
		}
		GetAddonLength() {
			return Addons.length;
		}
		GetAddonData(args) {
			return String(Addons[args.Pos - 1][args.Type]);
		}

		// スコア
		GChartID(args) {
			return `${args.MusID}_${args.DifID}`;
		}
		GetHscore(args) {
			if (!HScore[args.ChaID]) return 0;
			return Number(HScore[args.ChaID]);
		}
		UpdateHscore(args) {
			if (!HScore[args.ChaID] > args.Score) return;
			HScore[args.ChaID] = args.Score;
			localStorage.setItem('re_score', JSON.stringify(HScore));
		}
		GetRank(args) {
			return _getRank(args.Score);
		}
		// Mainスプライト
		GAMEor(args) {
			return (
				(args.main == '' || NDT.Var.Get('GAME.main') == args.main) &&
				(args.sub == '' || NDT.Var.Get('GAME.sub') == args.sub)
			);
		}
		NABP() {
			const TIME = NDT.Spr.Var.Get('main', 'TIME.game.sub');
			const SUB = NDT.Var.Get('GAME.sub');
			let r1 = -187;
			if (SUB == 'nanido_init_fromplayer') {
				const r2 = 0.6 - TIME;
				r1 = r1 - r2 * r2 * 400;
			} else if (SUB == 'nanido_out') {
				r1 = r1 - TIME * TIME * 400;
			}
			return r1;
		}
		Dif_X(args) {
			function T(Time) {
				if (0 > Time) return 0;
				return Time;
			}

			const TIME = NDT.Spr.Var.Get('main', 'TIME.game.sub');
			const SUB = NDT.Var.Get('GAME.sub');
			let r1 = -5;
			if (SUB == 'nanido_init' || SUB == 'nanido_init_fromplayer') {
				r1 = r1 + T(0.6 - TIME) * T(0.6 - TIME) * 1000;
			} else if (SUB == 'nanido_out' || SUB == 'nanido_out_tosenkyoku') {
				if (
					SUB == 'nanido_out_tosenkyoku' ||
					Number(NDT.Spr.Var.Get('main', 'MENU.choiceID')) !==
						Number(args.POS)
				) {
					r1 = r1 + T(TIME) * T(TIME) * 2000;
				} else {
					r1 = r1 + T(TIME - 0.15) * T(TIME - 0.15) * 2000;
				}
			}
			return r1;
		}
		Dif_Y(args) {
			return Number(
				NDT.Spr.Var.Get('main', 'MENU.scroll.nanido') +
					(Number(args.POS) - 1) *
						(NDT.Spr.Var.Get('main', '%MENU.songbar.space') * -1) -
					15,
			);
		}
		Dif_Length() {
			return (
				NDT.Spr.List.Get('main', '@MENU.songs_loaded.getDifficults')
					.length / 5
			);
		}
		Dif_ID(args) {
			return String(
				NDT.Spr.List.Get('main', '@MENU.songs_loaded.getDifficults')[
					(Number(args.POS) - 1) * 5 + 1
				],
			);
		}
		isDif(args) {
			return NDT.Spr.List.Get('main', 'UI.button')[0].startsWith(
				`difficult/${String(args.POS)}`,
			);
		}
		PLA_UI_Col() {
			if (NDT.Spr.Var.Get('main', '@IMG.blackOrWhite') == 'black') {
				return '#ffffff';
			} else {
				return '#000000';
			}
		}
		mainVarList() {
			return JSON.stringify(NDT.Spr.Var.NameList('main'));
		}
		mainVarGet(args) {
			return String(NDT.Spr.Var.Get('main', args.VarID));
		}
		mainVarSet(args) {
			NDT.Spr.Var.Set('main', args.VarID, args.Value);
		}
		mainListList() {
			return JSON.stringify(NDT.Spr.List.NameList('main'));
		}
		mainListGet(args) {
			return JSON.stringify(NDT.Spr.List.Get('main', args.VarID));
		}
		mainListSet(args) {
			const List = NDT.Spr.List.Get('main', args.VarID);
			List.length = 0;
			List.push(...JSON.parse(args.Value));
		}
		// 設定
		SaveOption() {
			const Options = NDT.Spr.Var.NameList('main').filter((v) =>
				v.startsWith('OPTION'),
			);
			const Data = Object.fromEntries(
				Options.map((v) => [v, NDT.Spr.Var.Get('main', v)]),
			);
			localStorage.setItem('re_option', JSON.stringify(Data));
		}
		SetNYADDONOption(args) {
			if (!AddonOption[args.ID]?.[args.Space]?.[args.Key]) return;
			_SetOption(args.ID, args.Space, args.Key, args.Value);
		}
		GetNYADDONOptionData(args) {
			if (!AddonOption[args.ID]?.[args.Space]?.[args.Key]) return;
			return String(
				AddonOption[args.ID][args.Space][args.Key][args.Type],
			);
		}
		GetNYADDONOptionValue(args) {
			if (!AddonOption[args.ID]?.[args.Space]?.[args.Key]) return;
			let v;
			if (
				AddonOption[args.ID]?.[args.Space]?.[args.Key].hasOwnProperty(
					'value',
				)
			) {
				v = AddonOption[args.ID]?.[args.Space]?.[args.Key].value;
			} else {
				v = AddonOption[args.ID][args.Space][args.Key].default;
			}
			if (AddonOption[args.ID]?.[args.Space]?.[args.Key].type == 'list') {
				return String(
					AddonOption[args.ID]?.[args.Space]?.[args.Key].list[
						Number(v) - 1
					],
				);
			}
			return String(v);
		}
		GetNYADDONOptionList(args) {
			if (!AddonOption[args.ID]?.[args.Space]?.[args.Key]) return;
			return String(
				AddonOption[args.ID][args.Space][args.Key].list[args.POS - 1],
			);
		}
		GetNYADDONOptionlength(args) {
			let out = AddonOption;
			if (args.ID !== '') out = out[args.ID];
			if (args.Space !== '') out = out[args.Space];
			if (args.Key !== '') out = out[args.Key];
			if (args.Type !== '') out = out[args.Type];
			return String(Object.keys(out).length);
		}
		GetNYADDONOptionPos(args) {
			let out = AddonOption;
			if (args.ID !== '') out = out[args.ID];
			if (args.Space !== '') out = out[args.Space];
			if (args.Key !== '') out = out[args.Key];
			return String(Object.keys(out)[args.POS - 1]);
		}
		showPrompt(args) {
			return String(window.prompt(args.PROMPT));
		}
		// NDT
		NDTVer() {
			return NDT.Info.Ver;
		}
		NDTMessage() {
			return NDT.Info.Message;
		}
		async Upload(args) {
			return await NDT.Upload(args.TYPE);
		}
		async LoadImage(args) {
			await NDT.Spr.Ast.Cos.Add(args.SPRITE, args.ID, args.URL);
		}
		isCostumeLoaded(args) {
			return NDT.Spr.Ast.Cos.NameList(args.SPRITE).includes(args.ID);
		}
		CostumeSize(args) {
			return NDT.VM.renderer.getSkinSize(
				NDT.Spr.Ast.Cos.Get(args.SPRITE, args.ID).skinId,
			)[0];
		}
		CostumeURL(args) {
			return NDT.Spr.Ast.Cos.Export(args.SPRITE, args.ID);
		}
		// その他
		PressSCKey(args) {
			PressKeys.push(args.KEY);
		}
		isTouching(args, util) {
			return _isTouching(util.target);
		}
		StartsW(args) {
			return JSON.stringify(
				JSON.parse(args.JSON).filter((v) => v.startsWith(args.TEXT)),
			);
		}
		tTot(args) {
			return String(args.TEXT.slice(args.F - 1, args.T));
		}
	}

	// ブロック用関数
	async function _Setup() {
		if (Setup || !NDT.Spr.NameList.includes('main')) return;
		Setup = true;
		if (
			localStorage.getItem(
				'extensions.turbowarp.org/local-storage:Na_ZeroneIII',
			) !== null
		) {
			localStorage.setItem(
				're_score',
				JSON.parse(
					localStorage.getItem(
						'extensions.turbowarp.org/local-storage:Na_ZeroneIII',
					),
				).data.score,
			);
			localStorage.removeItem(
				'extensions.turbowarp.org/local-storage:Na_ZeroneIII',
			);
			const List = await NS.DataList();
			for (const now of List) {
				await NS.Delete(now);
			}
		}
		if (localStorage.getItem('re-save') !== null) {
			localStorage.setItem('re_option', localStorage.getItem('re-save'));
			localStorage.removeItem('re-save');
		}
		const OP = JSON.parse(localStorage.getItem('re_option'));
		const HS = JSON.parse(localStorage.getItem('re_score'));
		const AD = JSON.parse(localStorage.getItem('re_addon'));
		const ADOPT = JSON.parse(localStorage.getItem('re_addon_option'));
		if (OP) {
			for (const [k, v] of Object.entries(OP)) {
				if (!NDT.Spr.Var.NameList('main').includes(k)) {
					NDT.Spr.Var.Create('main', k);
				}
				NDT.Spr.Var.Set('main', k, v);
			}
		}
		if (HS) {
			for (const [k, v] of Object.entries(HS)) {
				HScore[k] = v;
			}
		}
		if (ADOPT) {
			for (const [k, v] of Object.entries(ADOPT)) {
				AddonOption[k] = v;
			}
		}
		if (AD) {
			for (const now of AD) {
				Addons.push(now);
				if (!now.active) continue;
				const ADURL = await NS.Get(`re_addon_${now.id}`);
				const AD = await _InstallAddon(ADURL);
			}
		}
	}
	function _AllChart() {
		return _ChartData()
			.filter((c) => c.startsWith('#'))
			.map((c) => c.slice(1).split('/')[0]);
	}
	function _ChartData() {
		return NDT.List.Get('譜面データ/charts');
	}
	function _Reload() {
		NDT.Eve.Flag();
	}
	// ランク取得
	function _getRank(Score) {
		const List = {
			aj: 1000000,
			ex: 990000,
			ss: 980000,
			s: 960000,
			a: 940000,
			b: 900000,
			c: 800000,
			f: 0,
		};
		for (const [k, v] of Object.entries(List)) {
			if (v <= Score) return k;
		}
		return unknown;
	}
	function _toDataURL(U8A) {
		return `data:application/octet-stream;base64,${U8A.toBase64()}`;
	}
	// 譜面をインポートする関数
	async function _ImportChart(MODE = 'sc', SRC) {
		function getVar(target) {
			return Object.fromEntries(Object.values(target.variables));
		}
		function getList(target) {
			return Object.fromEntries(Object.values(target.lists));
		}

		const Mode = MODE.toLowerCase();
		let PJ, Author;
		if (Mode == 'sc') {
			const resData = await fetch(
				`https://trampoline.turbowarp.org/api/projects/${SRC}`,
			);
			const PJData = await resData.json();
			const res = await fetch(
				`https://projects.scratch.mit.edu/${SRC}?token=${PJData.project_token}`,
			);
			PJ = await res.json();
			Author = PJData.author.username;
		} else if (Mode == 'zip') {
			const res = await fetch(SRC);
			const data = await res.arrayBuffer();
			const U8A = new Uint8Array(data);
			const PJZip = fflate.unzipSync(U8A);
			PJ = JSON.parse(fflate.strFromU8(PJZip['project.json']));
			Author = 'unknown';
		}

		const targets = PJ.targets;

		const main = targets.filter((t) => t.name == 'main')[0];
		const music = targets.filter((t) => t.name == 'MUSIC')[0];
		const stage = targets.filter((t) => t.isStage)[0];
		const is_old = Object.keys(getVar(main)).includes('Editor-TIM');

		const chartsAll = Object.keys(getList(stage)).includes(
			'譜面データ/charts',
		)
			? getList(stage)['譜面データ/charts']
			: getList(main).songsdata;
		const soundsAll = music ? music.sounds : main.sounds;
		const sounds = {};
		for (const now of soundsAll) {
			sounds[now.name] = now.md5ext;
		}
		const costumes = main.costumes;

		const InstallModList = [];
		const LCcharts = NDT.List.Get('譜面データ/charts');

		let skip = false;
		let title = '';
		for (const now of chartsAll) {
			const spl = now.split('/');
			if (now.startsWith('#')) {
				const name = spl[0].slice(1);
				skip = LCcharts.includes(now);
				title = name;
				if (!skip) {
					ChartUser[title] = Author;
					if (!NDT.Spr.Ast.Sou.NameList('MUSIC').includes(now)) {
						let url;
						if (
							Mode == 'zip' &&
							Object.keys(PJZip).includes(sounds[name])
						) {
							url = _toDataURL(PJZip[sounds[name]]);
						} else {
							url = `https://assets.scratch.mit.edu/internalapi/asset/${sounds[name]}/get`;
						}
						await NDT.Spr.Ast.Sou.Add('MUSIC', name, url);
					}
				}
			}
			if (!skip) {
				if (spl[0].toLowerCase() == 'mod') {
					InstallModList.push(spl[1]);
					Mods.push({
						id: spl[1],
						chart: title,
					});
				}
				if (is_old && Number.isFinite(Number(spl[0]))) {
					const note = spl;
					note[2] = note[2] * 2;
					LCcharts.push(note.join('/'));
				} else {
					LCcharts.push(now);
				}
			}
		}
		for (const now of costumes) {
			if (!NDT.Spr.Ast.Cos.NameList('main').includes(now.name)) {
				let url;
				if (Mode == 'zip' && Object.keys(PJZip).includes(now.md5ext)) {
					url = _toDataURL(PJZip[now.md5ext]);
				} else {
					url = `https://assets.scratch.mit.edu/internalapi/asset/${now.md5ext}/get`;
				}
				url = await _resizeImage(url);
				await NDT.Spr.Ast.Cos.Add('main', now.name, url);
			}
		}

		for (const now of targets) {
			if (!(now.isStage || NDT.Spr.NameList.includes(now.name))) {
				const messages = Object.values(now.blocks)
					.filter((b) => b.opcode == 'event_whenbroadcastreceived')
					.map((b) => b.fields.BROADCAST_OPTION[0]);
				let install = false;
				for (const tnow of InstallModList) {
					if (messages.includes(tnow)) {
						install = true;
						Mods.filter((m) => (m.id = tnow))[0].sprite = now.name;
						break;
					}
				}
				if (!install) continue;
				const SPZip = {
					'sprite.json': fflate.strToU8(JSON.stringify(now)),
				};
				for (const tnow of now.costumes) {
					let url;
					if (
						Mode == 'zip' &&
						Object.keys(PJZip).includes(tnow.md5ext)
					) {
						url = _toDataURL(PJZip[tnow.md5ext]);
					} else {
						url = `https://assets.scratch.mit.edu/internalapi/asset/${tnow.md5ext}/get`;
					}
					const res = await fetch(url);
					const data = await res.arrayBuffer();
					const U8A = new Uint8Array(data);
					SPZip[tnow.md5ext] = U8A;
				}
				for (const tnow of now.sounds) {
					let url;
					if (
						Mode == 'zip' &&
						Object.keys(PJZip).includes(tnow.md5ext)
					) {
						url = _toDataURL(PJZip[tnow.md5ext]);
					} else {
						url = `https://assets.scratch.mit.edu/internalapi/asset/${tnow.md5ext}/get`;
					}
					const res = await fetch(url);
					const data = await res.arrayBuffer();
					const U8A = new Uint8Array(data);
					SPZip[tnow.md5ext] = U8A;
				}
				await NDT.Spr.Add(
					_toDataURL(
						fflate.zipSync(SPZip, {
							level: 0,
						}),
					),
				);
			}
		}
	}
	// アドオンをインストールする関数
	async function _InstallAddon(url) {
		const res = await fetch(url);
		const data = await res.arrayBuffer();
		const AD = new Uint8Array(data);
		const ADZip = fflate.unzipSync(AD);
		const MFest = JSON.parse(fflate.strFromU8(ADZip['manifest.json']));
		const SPURL = _toDataURL(ADZip['sprite.sprite3']);
		if (Object.keys(AddonSprite).includes(MFest.id)) {
			if (
				MFest.version ==
				NDT.Spr.Get(AddonSprite[MFest.id]).mfest.version
			)
				return MFest;
			NDT.Spr.Delete(AddonSprite[MFest.id]);
		}

		const target = await NDT.Spr.Add(SPURL);
		AddonSprite[MFest.id] = target.id;
		const render = Object.values(target.blocks._blocks).filter(
			(b) =>
				b.opcode == 'event_whenbroadcastreceived' &&
				b.fields.BROADCAST_OPTION.value == 'RENDER',
		)[0];
		if (render) {
			MFest.reload = true;
		}
		target.mfest = MFest;
		return MFest;
	}
	function _UninstallAddon(id) {
		if (
			!(
				Object.keys(AddonSprite).includes(id) &&
				NDT.Spr.IDList.includes(AddonSprite[id])
			)
		)
			return;
		NDT.Spr.Delete(AddonSprite[id]);
		delete AddonSprite[id];
	}
	function _SetOption(id, space, key, value) {
		if (
			(value == 'up' || value == 'down') &&
			AddonOption[id][space][key].type == 'list'
		) {
			if (!AddonOption[id][space][key].hasOwnProperty('value'))
				AddonOption[id][space][key].value =
					AddonOption[id][space][key].default;
			if (value == 'down') {
				AddonOption[id][space][key].value =
					Number(AddonOption[id][space][key].value) - 1;
				if (1 > AddonOption[id][space][key].value)
					AddonOption[id][space][key].value =
						AddonOption[id][space][key].list.length;
			} else {
				AddonOption[id][space][key].value =
					Number(AddonOption[id][space][key].value) + 1;
				if (
					AddonOption[id][space][key].list.length <
					AddonOption[id][space][key].value
				)
					AddonOption[id][space][key].value = 1;
			}
		} else {
			AddonOption[id][space][key].value = value;
		}
		localStorage.setItem('re_addon_option', JSON.stringify(AddonOption));
	}
	// リサイズ
	async function _resizeImage(
		url,
		maxWidth = 7,
		maxHeight = 7,
		sharp = true,
	) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';

			img.onload = () => {
				let width = img.naturalWidth;
				let height = img.naturalHeight;

				if (width > maxWidth || height > maxHeight) {
					const scale = Math.min(
						maxWidth / width,
						maxHeight / height,
					);
					width = Math.round(width * scale);
					height = Math.round(height * scale);
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');

				ctx.imageSmoothingEnabled = !sharp;

				ctx.drawImage(img, 0, 0, width, height);

				const dataURL = canvas.toDataURL('image/png');
				resolve(dataURL);
			};

			img.onerror = () =>
				reject(new Error('画像の読み込みに失敗しました'));
			img.src = url;
		});
	}

	// NyankoExtensionCreater
	// 短縮表現変換
	function abbreviation(code, ...link) {
		for (const word of link) {
			if (code.toLowerCase().startsWith(word.toLowerCase()[0])) {
				return word;
			}
		}
		log('w', `引数として想定されていない値が入力されました: ${code}`);
		return code;
	}
	// ログ
	function log(type = 'log', output) {
		const lstype = abbreviation(type, 'log', 'warn', 'error');
		console[lstype](`[NEC] ${output}`);
	}
	// 型チェック
	function chktype(data, type) {
		if (typeof data !== type) {
			log(
				'e',
				`引数に指定できない型が指定されています!: 入力=>${typeof data} 要求=>${type}`,
			);
		}
	}

	// getInfo
	function GenerateBlocksInfo(id, name, blocks = {}, option = {}) {
		chktype(blocks, 'object');
		chktype(option, 'object');
		return {
			...{
				id: id,
				name: name,
				blocks: blocks,
			},
			...option,
		};
	}
	// ラベル
	function label(labeltext) {
		chktype(labeltext, 'string');
		return { blockType: 'label', text: labeltext };
	}
	function block(opcode, type, text, args = {}) {
		chktype(type, 'string');
		chktype(text, 'string');
		chktype(args, 'object');
		// typeの短縮変換
		const lstype = abbreviation(
			type,
			'COMMAND',
			'REPORTER',
			'BOOLEAN',
			'HAT',
			'EVENT',
		);

		// argsの確認
		const allblockargs =
			text.match(/\[(.*?)\]/g)?.map((s) => s.slice(1, -1)) || [];
		const allinputargs = Object.keys(args);
		for (const chk of allblockargs) {
			if (!allinputargs.includes(chk)) {
				log(
					'w',
					`block"${opcode}"に必要なargが渡されていません: ${chk}`,
				);
			}
		}
		for (const chk of allinputargs) {
			if (!allblockargs.includes(chk)) {
				log(
					'w',
					`block"${opcode}"に不必要なargが渡されています: ${chk}`,
				);
			}
		}
		return {
			opcode: opcode,
			blockType: Scratch.BlockType[lstype],
			text: text,
			arguments: args,
		};
	}
	function blocks(...blocks) {
		chktype(blocks, 'object');
		return blocks;
	}
	function arg(id, type, def = '', menu = '') {
		chktype(type, 'string');
		const lstype = abbreviation(
			type,
			'STRING',
			'NUMBER',
			'BOOLEAN',
			'COSTUME',
			'SOUND',
			'ANGLE',
			'MATRIX',
			'NOTE',
			'IMAGE',
			'COLOR',
		);
		return {
			[id]: {
				type: Scratch.ArgumentType[lstype],
				defaultValue: def,
				menu: menu,
			},
		};
	}
	function args(...args) {
		chktype(args, 'object');
		return Object.assign({}, ...args);
	}

	// NekoStorage
	const NS = (() => {
		const DB_NAME = 'NekoStorage';
		const STORE_NAME = 'nekostore';
		const NAMESPACE = 'NA.RE-013';
		const PREFIX = `${NAMESPACE}:`;
		let db = null;
		const openDB = () => {
			return new Promise((resolve, reject) => {
				const request = indexedDB.open(DB_NAME, 1);
				request.onupgradeneeded = (e) => {
					const dbTemp = e.target.result;
					if (!dbTemp.objectStoreNames.contains(STORE_NAME)) {
						dbTemp.createObjectStore(STORE_NAME, {
							keyPath: 'key',
						});
					}
				};
				request.onsuccess = (e) => {
					db = e.target.result;
					resolve(db);
				};
				request.onerror = (e) => reject(e.target.error);
			});
		};
		const ensureDB = async () => {
			if (!db) await openDB();
		};
		const Set = async (key, value) => {
			if (key === undefined || key === null)
				throw new Error('Keyは必須です');
			await ensureDB();
			const fullKey = PREFIX + String(key);
			const record = {
				key: fullKey,
				value: JSON.stringify(value),
				timestamp: Date.now(),
			};
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				store.put(record);
				tx.oncomplete = () => resolve();
				tx.onerror = (e) => reject(e.target.error);
			});
		};
		const Get = async (key) => {
			if (key === undefined || key === null) return null;
			await ensureDB();
			const fullKey = PREFIX + String(key);
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readonly');
				const store = tx.objectStore(STORE_NAME);
				const request = store.get(fullKey);
				request.onsuccess = () => {
					const rec = request.result;
					if (!rec) return resolve(null);
					try {
						resolve(JSON.parse(rec.value));
					} catch {
						resolve(rec.value);
					}
				};
				request.onerror = (e) => reject(e.target.error);
			});
		};
		const Delete = async (key) => {
			await ensureDB();
			return new Promise((resolve, reject) => {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				if (key === undefined || key === null) {
					const cursorRequest = store.openCursor();
					cursorRequest.onsuccess = (e) => {
						const cursor = e.target.result;
						if (cursor) {
							if (cursor.key.startsWith(PREFIX)) {
								cursor.delete();
							}
							cursor.continue();
						}
					};
					tx.oncomplete = () => resolve();
					tx.onerror = (e) => reject(e.target.error);
				} else {
					const fullKey = PREFIX + String(key);
					store.delete(fullKey);
					tx.oncomplete = () => resolve();
					tx.onerror = (e) => reject(e.target.error);
				}
			});
		};
		const DataList = async () => {
			await ensureDB();
			return new Promise((resolve, reject) => {
				const keys = [];
				const tx = db.transaction(STORE_NAME, 'readonly');
				const store = tx.objectStore(STORE_NAME);
				const request = store.openCursor();
				request.onsuccess = (e) => {
					const cursor = e.target.result;
					if (cursor) {
						const k = cursor.key;
						if (typeof k === 'string' && k.startsWith(PREFIX)) {
							keys.push(k.slice(PREFIX.length));
						}
						cursor.continue();
					} else {
						resolve(keys);
					}
				};
				request.onerror = (e) => reject(e.target.error);
			});
		};
		return { Set, Get, Delete, DataList };
	})();
	// 下の関数がNDTを要求するのでこのタイミングでセットアップ
	await Extension_Setup();
	// タップ検出
	const _isTouching = (function () {
		if (!(navigator.maxTouchPoints > 0 || 'ontouchstart' in window)) {
			return () => false;
		}

		const vm = NDT.VM;
		if (!vm?.runtime?.renderer?.canvas) return () => false;

		const canvas = vm.runtime.renderer.canvas;
		const fingers = new Map(); // Scratch ID → {x, y}
		const nativeToScratch = new Map(); // native identifier → Scratch ID

		const nextId = () => {
			let id = 1;
			while (fingers.has(id)) id++;
			return id;
		};

		const updatePos = (touch, rect) => ({
			x: touch.clientX - rect.left,
			y: touch.clientY - rect.top,
		});

		const handleStart = (e) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			for (const t of e.changedTouches) {
				const id = nextId();
				nativeToScratch.set(t.identifier, id);
				fingers.set(id, updatePos(t, rect));
			}
		};

		const handleMove = (e) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			for (const t of e.changedTouches) {
				const id = nativeToScratch.get(t.identifier);
				if (id) fingers.set(id, updatePos(t, rect));
			}
		};

		const handleEnd = (e) => {
			e.preventDefault();
			for (const t of e.changedTouches) {
				const id = nativeToScratch.get(t.identifier);
				if (id) {
					fingers.delete(id);
					nativeToScratch.delete(t.identifier);
				}
			}
		};

		canvas.addEventListener('touchstart', handleStart, { passive: false });
		canvas.addEventListener('touchmove', handleMove, { passive: false });
		canvas.addEventListener('touchend', handleEnd, { passive: false });
		canvas.addEventListener('touchcancel', handleEnd, { passive: false });

		return (target) => {
			if (!target?.isTouchingPoint) return false;
			for (const { x, y } of fingers.values()) {
				if (target.isTouchingPoint(x, y)) return true;
			}
			return false;
		};
	})();
	Scratch.extensions.register(new ReLaserExt());
})(Scratch);
