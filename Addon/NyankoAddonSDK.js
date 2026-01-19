// Name: NyankoAddonSDK
// ID: NASDK
// Description: Re:LASER@NyankoAddonの外部アドオンを作成するための拡張機能。
// By: nyantorusabu

(async function (Scratch) {
	'use strict';

	// 変数定義

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
	}

	class NASDK {
		getInfo() {
			return GenerateBlocksInfo(
				'NASDK',
				'NyankoAddonSDK',
				blocks(
					label('操作'),
					label('ファイル'),
					button('外部アドオンを新規作成', 'CreateAddon'),
					button('外部アドオンを開く', 'LoadAddon'),
					button('外部アドオンを保存', 'SaveAddon'),
					label('AddonV1'),
					button('AddonV1を開く', 'LoadAddonV1'),
					button('AddonV1>V2移行', 'V1ToV2'),
					label('@manifest'),
					button('@manifestを生成', 'GenerateMFest'),
					button('@manifestを編集', 'EditMFest'),
					'---',
					label('ブロック'),
					label('取得'),
					block(
						'GetRLVar',
						'R',
						'RLVar [ID]',
						arg('ID', 'S', 'GMain'),
					),
				),
				{
					menuIconURI:
						'https://nyantorusabu.github.io/Re-013/Asset/NASDK/menu.png',
					blockIconURI:
						'https://nyantorusabu.github.io/Re-013/Asset/NASDK/block.png',
					color1: '#ffad87',
					color2: '#ff9c6e',
					color3: '#ff8a54',
				},
			);
		}

		// ブロックの定義
		GetRLVar(args) {
			const RLVarList = {
				GMain: NDT.Var.Get('GAME.main'),
				GSub: NDT.Var.Get('GAME.sub'),
			};

			const ID = args.ID;
			if (!Object.keys(RLVarList).includes(ID)) return '';
			return RLVarList[ID];
		}
		async CreateAddon() {
			const mfest = {
				id: crypto.randomUUID(),
				name: window.prompt('アドオンの名前を入力'),
				description: window.prompt('アドオンの説明を入力'),
				author: window.prompt('あなたのニックネームを入力'),
				version: '1.0.0',
			};
			const Spr = await NDT.Spr.Add(
				'https://nyantorusabu.github.io/Re-013/Asset/NASDK/Template.sprite3',
			);
			NDT.Spr.Get(Spr.id).mfest = mfest;
			NDT.Spr.Rename(Spr.id, mfest.name);
		}
		async LoadAddon() {
			await _LoadAddon(await NDT.Upload('.naddon'));
		}
		async SaveAddon() {
			const target = NDT.Spr.Editing;
			const SP = await NDT.VM.exportSprite(target.id);
			const aB = await SP.arrayBuffer();
			const U8A = new Uint8Array(aB);
			const AD = {
				'manifest.json': fflate.strToU8(JSON.stringify(target.mfest)),
				'sprite.sprite3': U8A,
			};
			const ADZip = fflate.zipSync(AD, {
				level: 0,
			});
			const a = document.createElement('a');
			a.href = URL.createObjectURL(
				new Blob([ADZip], { type: 'application/zip' }),
			);
			a.download = `${target.mfest.name}.naddon`;
			a.click();
			URL.revokeObjectURL(a.href);
		}
		V1ToV2() {
			_V1ToV2(NDT.Spr.Editing.id);
			window.alert(`AddonV1>V2の移行が完了しました`);
		}
		async LoadAddonV1() {
			const URL = await NDT.Upload('.sprite3');
			const data = new Uint8Array(await (await fetch(URL)).arrayBuffer());
			const SPZip = fflate.unzipSync(data);
			const SP = JSON.parse(fflate.strFromU8(SPZip['sprite.json']));
			_V1ToV2((await NDT.Spr.Add(URL)).id);
		}
		GenerateMFest() {
			const target = NDT.Spr.Editing;
			if (Object.keys(target).includes('mfest')) {
				window.alert('既に@manifestが存在します');
				return;
			}
			const mfest = {
				id: crypto.randomUUID(),
				name: target.getName(),
				description: window.prompt('アドオンの説明を入力'),
				author: window.prompt('あなたのニックネームを入力'),
				version: '1.0.0',
			};
			target.mfest = mfest;
			window.alert(`@manifestを生成しました`);
		}
		EditMFest() {}
	}

	function _V1ToV2(SprID) {
		const List = {
			'GAME.main': 'GMain',
			'GAME.sub': 'GSub',
		};
		const target = NDT.Spr.Get(SprID);

		const CMT = Object.entries(target.comments).filter((c) =>
			c[1].text.includes('@manifest'),
		)[0];
		if (target.mfest || !CMT) {
			window.alert(
				`スプライト"${target.getName()}"はAddonV1ではありません`,
			);
			return;
		}
		const mfest = JSON.parse(CMT[1].text.replace('@manifest', ''));
		delete mfest.restart;
		target.mfest = mfest;
		delete target.comments[CMT[0]];
		const BLO = Object.values(target.blocks._blocks).filter(
			(b) =>
				b.opcode == 'sensing_of' &&
				Object.keys(List).filter((k) => k == b.fields.PROPERTY.value)
					.length > 0,
		);
		if (BLO) {
			for (const now of BLO) {
				const id = GenerateUid();
				const b = target.blocks._blocks[now.id];
				target.blocks._blocks[id] = {
					id: id,
					opcode: 'text',
					inputs: {},
					fields: {
						TEXT: {
							id: undefined,
							name: 'TEXT',
							value: List[b.fields.PROPERTY.value],
						},
					},
					next: null,
					topLevel: false,
					parent: now.id,
					shadow: true,
				};
				const OBJ = b.inputs.OBJECT;
				if (OBJ.shadow == OBJ.block) {
					delete target.blocks._blocks[OBJ.block];
				}
				delete target.blocks._blocks[OBJ.shadow];
				b.opcode = 'NASDK_GetRLVar';
				b.inputs = {
					ID: {
						name: 'ID',
						block: id,
						shadow: id,
					},
				};
				b.fields = {};
			}
		}
		NDT.VM.emitWorkspaceUpdate();
	}
	async function _LoadAddon(URL) {
		const res = await fetch(URL);
		const data = await res.arrayBuffer();
		const U8A = new Uint8Array(data);
		const ADZip = fflate.unzipSync(U8A);
		const SPURL = `data:application/octet-stream;base64,${ADZip[
			'sprite.sprite3'
		].toBase64()}`;
		const SPZip = fflate.unzipSync(ADZip['sprite.sprite3']);
		const SP = JSON.parse(fflate.strFromU8(SPZip['sprite.json']));
		const Spr = await NDT.Spr.Add(SPURL);
		NDT.Spr.Get(Spr.id).mfest = JSON.parse(
			fflate.strFromU8(ADZip['manifest.json']),
		);
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
	function button(text, func) {
		chktype(text, 'string');
		chktype(func, 'string');
		return {
			blockType: Scratch.BlockType.BUTTON,
			text: text,
			func: func,
		};
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
	function GenerateUid() {
		return (
			Math.random().toString(36).substring(2, 12) +
			Math.random().toString(36).substring(2, 12)
		);
	}

	// セットアップを実行してから拡張機能を認証
	await Extension_Setup();
	Scratch.extensions.register(new NASDK());
})(Scratch);
