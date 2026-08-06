// Name: NyankoAddonSDK
// ID: NASDK
// Description: Re:LASER@NyankoAddonの外部アドオンを作成するための拡張機能。
// By: nyantorusabu

(async function (Scratch) {
	'use strict';

	// 変数定義
	const SDK_VER = '1.0.5';

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
					label('OPTION'),
					button('OPTIONを編集', 'EditOption'),
					'---',
					label('ブロック'),
					label('取得'),
					block(
						'GetRLVar',
						'R',
						'RLVar [ID]',
						arg('ID', 'S', 'GMain'),
					),
					block(
						'GetOption',
						'R',
						'option [SpaceID] [DataID]',
						args(
							arg('SpaceID', 'S', 'Setting'),
							arg('DataID', 'S', 'Volume'),
						),
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
		GetOption(args, util) {
			if (!window.NYADDON) return;
			const target = util.target;
			const mfest = target.mfest;
			return String(
				NYADDON.GetOption(mfest.id, args.SpaceID, args.DataID),
			);
		}
		async CreateAddon() {
			const res = await _PromptManifest('外部アドオンを新規作成', {
				name: '',
				description: '',
				author: '',
				version: '1.0.0',
			});
			if (!res) return; // キャンセルされた場合

			const mfest = {
				id: crypto.randomUUID(),
				name: res.name,
				description: res.description,
				author: res.author,
				version: res.version,
				sdk: 'NYADDONSDK',
				sdk_ver: SDK_VER,
				option: {},
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
			if (_V1ToV2(NDT.Spr.Editing.id)) {
				window.alert(`AddonV1>V2の移行が完了しました`);
			}
		}
		async LoadAddonV1() {
			const URL = await NDT.Upload('.sprite3');
			const data = new Uint8Array(await (await fetch(URL)).arrayBuffer());
			const SPZip = fflate.unzipSync(data);
			const SP = JSON.parse(fflate.strFromU8(SPZip['sprite.json']));
			if (!_V1ToV2((await NDT.Spr.Add(URL)).id)) return;
		}
		async GenerateMFest() {
			const target = NDT.Spr.Editing;
			if (!target) return;
			if (Object.keys(target).includes('mfest')) {
				window.alert('既に@manifestが存在します');
				return;
			}

			const res = await _PromptManifest('@manifestを生成', {
				name: target.getName(),
				description: '',
				author: '',
				version: '1.0.0',
			});
			if (!res) return;

			const mfest = {
				id: crypto.randomUUID(),
				name: res.name,
				description: res.description,
				author: res.author,
				version: res.version,
				sdk: 'NYADDONSDK',
				sdk_ver: SDK_VER,
				option: {},
			};
			target.mfest = mfest;
			NDT.Spr.Rename(target.id, mfest.name);
			window.alert(`@manifestを生成しました`);
		}
		async EditMFest() {
			const target = NDT.Spr.Editing;
			if (!target || !target.mfest) {
				window.alert(
					'@manifestが存在しません。先に生成または作成してください。',
				);
				return;
			}

			const res = await _PromptManifest('@manifestを編集', target.mfest);
			if (!res) return;

			target.mfest.name = res.name;
			target.mfest.description = res.description;
			target.mfest.author = res.author;
			target.mfest.version = res.version;

			NDT.Spr.Rename(target.id, target.mfest.name);
			window.alert(`@manifestを編集・更新しました`);
		}
		async EditOption() {
			const target = NDT.Spr.Editing;
			if (!target || !target.mfest) {
				window.alert(
					'@manifestが存在しません。先に生成または作成してください。',
				);
				return;
			}
			if (!target.mfest.option) {
				target.mfest.option = {};
			}

			const res = await _PromptOption(
				'OPTIONを編集',
				target.mfest.option,
			);
			if (!res) return;

			target.mfest.option = res;
			window.alert(`OPTIONを編集・更新しました`);
		}
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
			return false;
		}
		const mfest = JSON.parse(CMT[1].text.replace('@manifest', ''));
		delete mfest.restart;
		mfest.sdk = 'NYADDONSDK';
		mfest.sdk_ver = SDK_VER;
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
		const EBLO = Object.values(target.blocks._blocks).filter(
			(b) =>
				b.opcode == 'event_whenbroadcastreceived' &&
				b.fields.BROADCAST_OPTION.value == 'Addon_Run',
		);
		if (EBLO) {
			for (const now of EBLO) {
				const b = target.blocks._blocks[now.id];
				b.opcode = 'event_whenflagclicked';
				b.fields = {};
			}
		}
		NDT.VM.emitWorkspaceUpdate();
		return true;
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

	// @manifest制作用のシンプルモーダルUI
	function _PromptManifest(titleText, initialData) {
		return new Promise((resolve) => {
			// 古いモーダルが残っていれば削除
			const oldModal = document.getElementById('nasdk-manifest-modal');
			if (oldModal) oldModal.remove();

			// 背景レイヤー
			const backdrop = document.createElement('div');
			backdrop.id = 'nasdk-manifest-modal';
			backdrop.style =
				'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);display:flex;justify-content:center;align-items:center;z-index:999999;font-family:sans-serif;';

			// モーダル本体
			const modal = document.createElement('div');
			modal.style =
				'background:white;padding:20px;border-radius:8px;width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.15);color:#333;';

			// タイトル
			const title = document.createElement('h3');
			title.innerText = titleText;
			title.style.margin = '0 0 15px 0';
			title.style.fontSize = '16px';
			title.style.borderBottom = '1px solid #eee';
			title.style.paddingBottom = '8px';
			modal.appendChild(title);

			// 入力フィールドの構造定義
			const fields = [
				{
					label: 'アドオンの名前',
					key: 'name',
					value: initialData.name || '',
				},
				{
					label: 'アドオンの説明',
					key: 'description',
					value: initialData.description || '',
				},
				{
					label: 'あなたのニックネーム',
					key: 'author',
					value: initialData.author || '',
				},
				{
					label: 'バージョン',
					key: 'version',
					value: initialData.version || '1.0.0',
				},
			];

			const inputs = {};
			for (const f of fields) {
				const container = document.createElement('div');
				container.style.marginBottom = '12px';
				const lbl = document.createElement('label');
				lbl.innerText = f.label;
				lbl.style.display = 'block';
				lbl.style.fontSize = '12px';
				lbl.style.marginBottom = '4px';
				lbl.style.color = '#555';
				lbl.style.fontWeight = 'bold';

				const input = document.createElement('input');
				input.type = 'text';
				input.value = f.value;
				input.style.width = '100%';
				input.style.boxSizing = 'border-box';
				input.style.padding = '6px 8px';
				input.style.border = '1px solid #ccc';
				input.style.borderRadius = '4px';
				input.style.fontSize = '14px';

				container.appendChild(lbl);
				container.appendChild(input);
				modal.appendChild(container);
				inputs[f.key] = input;
			}

			// ボタンコンテナ
			const btnContainer = document.createElement('div');
			btnContainer.style.display = 'flex';
			btnContainer.style.justifyContent = 'flex-end';
			btnContainer.style.gap = '10px';
			btnContainer.style.marginTop = '15px';

			// キャンセルボタン
			const cancelBtn = document.createElement('button');
			cancelBtn.innerText = 'キャンセル';
			cancelBtn.style.padding = '6px 12px';
			cancelBtn.style.border = '1px solid #ccc';
			cancelBtn.style.borderRadius = '4px';
			cancelBtn.style.background = '#fff';
			cancelBtn.style.cursor = 'pointer';
			cancelBtn.style.fontSize = '13px';
			cancelBtn.onclick = () => {
				backdrop.remove();
				resolve(null);
			};

			// 確定ボタン
			const saveBtn = document.createElement('button');
			saveBtn.innerText = '確定';
			saveBtn.style.padding = '6px 12px';
			saveBtn.style.background = '#ff8a54'; // NASDKのテーマカラーに追従
			saveBtn.style.color = 'white';
			saveBtn.style.border = 'none';
			saveBtn.style.borderRadius = '4px';
			saveBtn.style.cursor = 'pointer';
			saveBtn.style.fontSize = '13px';
			saveBtn.onclick = () => {
				const result = {};
				for (const key in inputs) {
					result[key] = inputs[key].value;
				}
				backdrop.remove();
				resolve(result);
			};

			btnContainer.appendChild(cancelBtn);
			btnContainer.appendChild(saveBtn);
			modal.appendChild(btnContainer);
			backdrop.appendChild(modal);
			document.body.appendChild(backdrop);
		});
	}

	// OPTION制作用のシンプルモーダルUI (タブ切り替え・インライン管理版)
	function _PromptOption(titleText, initialData) {
		return new Promise((resolve) => {
			const oldModal = document.getElementById('nasdk-option-modal');
			if (oldModal) oldModal.remove();

			const backdrop = document.createElement('div');
			backdrop.id = 'nasdk-option-modal';
			backdrop.style =
				'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);display:flex;justify-content:center;align-items:center;z-index:999999;font-family:sans-serif;';

			const modal = document.createElement('div');
			modal.style =
				'background:white;padding:20px;border-radius:8px;width:960px;height:80%;max-height:85%;display:flex;flex-direction:column;box-shadow:0 4px 12px rgba(0,0,0,0.15);color:#333;';

			const title = document.createElement('h3');
			title.innerText = titleText;
			title.style.margin = '0 0 15px 0';
			title.style.fontSize = '16px';
			title.style.borderBottom = '1px solid #eee';
			title.style.paddingBottom = '8px';
			modal.appendChild(title);

			// データ管理用の内部状態オブジェクト
			const spacesData = {};
			// Spaceの並び順を管理する配列（ドラッグ&ドロップでの並べ替えに使用）
			const spaceOrder = [];

			// 初期データのマッピング
			if (initialData && typeof initialData === 'object') {
				for (const spaceID in initialData) {
					if (
						Object.prototype.hasOwnProperty.call(
							initialData,
							spaceID,
						)
					) {
						const spaceObj = initialData[spaceID];
						if (spaceObj && typeof spaceObj === 'object') {
							spacesData[spaceID] = {
								text: spaceObj.text || spaceID,
								datas: [],
							};
							spaceOrder.push(spaceID);
							for (const dataID in spaceObj) {
								if (dataID === 'text') continue;
								if (
									Object.prototype.hasOwnProperty.call(
										spaceObj,
										dataID,
									)
								) {
									const item = spaceObj[dataID];
									if (
										item &&
										typeof item === 'object' &&
										('default' in item || 'value' in item)
									) {
										spacesData[spaceID].datas.push({
											id: dataID,
											text: item.text || '',
											type: item.type || 'text',
											default:
												item.default !== undefined
													? item.default
													: item.value,
											min:
												item.min !== undefined
													? item.min
													: '',
											max:
												item.max !== undefined
													? item.max
													: '',
											amount:
												item.amount !== undefined
													? item.amount
													: '',
										});
									} else {
										const guessedType = Array.isArray(item)
											? 'list'
											: typeof item === 'number'
												? 'number'
												: typeof item === 'boolean'
													? 'boolean'
													: 'text';
										spacesData[spaceID].datas.push({
											id: dataID,
											text: '',
											type: guessedType,
											default: item,
											min: '',
											max: '',
											amount: '',
										});
									}
								}
							}
						}
					}
				}
			}

			// データが完全に空の場合のデフォルト初期値
			if (spaceOrder.length === 0) {
				spacesData['Setting'] = {
					text: '設定',
					datas: [
						{
							id: 'Volume',
							text: '音量',
							type: 'number',
							default: 100,
							min: 0,
							max: 100,
							amount: 1,
						},
					],
				};
				spaceOrder.push('Setting');
			}

			// 現在選択されているSpaceIDの管理
			let currentSpaceId = spaceOrder[0];

			// --- タブ切り替え用のUI定義 ---
			const tabContainer = document.createElement('div');
			tabContainer.style =
				'display:flex; gap:5px; margin-bottom:15px; border-bottom:1px solid #ccc; padding-bottom:5px;';
			modal.appendChild(tabContainer);

			const spaceTabBtn = document.createElement('button');
			spaceTabBtn.innerText = 'Space設定';
			spaceTabBtn.type = 'button';
			const dataTabBtn = document.createElement('button');
			dataTabBtn.innerText = 'データ設定';
			dataTabBtn.type = 'button';

			const tabBtnStyle =
				'padding:6px 12px; border:1px solid #ccc; border-bottom:none; border-radius:4px 4px 0 0; cursor:pointer; font-size:13px; background:#f0f0f0; outline:none;';
			spaceTabBtn.style = tabBtnStyle;
			dataTabBtn.style = tabBtnStyle;

			tabContainer.appendChild(spaceTabBtn);
			tabContainer.appendChild(dataTabBtn);

			// 各タブのメインコンテナ
			const spaceTabContent = document.createElement('div');
			spaceTabContent.style =
				'flex:1; display:none; flex-direction:column; overflow:hidden;';
			const dataTabContent = document.createElement('div');
			dataTabContent.style =
				'flex:1; display:none; flex-direction:column; overflow:hidden;';

			modal.appendChild(spaceTabContent);
			modal.appendChild(dataTabContent);

			function setTab(tab) {
				if (tab === 'space') {
					spaceTabContent.style.display = 'flex';
					dataTabContent.style.display = 'none';
					spaceTabBtn.style.background = '#fff';
					spaceTabBtn.style.fontWeight = 'bold';
					spaceTabBtn.style.borderBottom = '1px solid #fff';
					spaceTabBtn.style.marginBottom = '-1px';
					dataTabBtn.style.background = '#f0f0f0';
					dataTabBtn.style.fontWeight = 'normal';
					dataTabBtn.style.borderBottom = '1px solid #ccc';
					dataTabBtn.style.marginBottom = '0';
					renderSpaceRows();
				} else {
					spaceTabContent.style.display = 'none';
					dataTabContent.style.display = 'flex';
					dataTabBtn.style.background = '#fff';
					dataTabBtn.style.fontWeight = 'bold';
					dataTabBtn.style.borderBottom = '1px solid #fff';
					dataTabBtn.style.marginBottom = '-1px';
					spaceTabBtn.style.background = '#f0f0f0';
					spaceTabBtn.style.fontWeight = 'normal';
					spaceTabBtn.style.borderBottom = '1px solid #ccc';
					spaceTabBtn.style.marginBottom = '0';
					updateSpaceSelectOptions();
					renderDataRows();
				}
			}

			spaceTabBtn.onclick = () => setTab('space');
			dataTabBtn.onclick = () => setTab('data');

			const spaceAddForm = document.createElement('div');
			spaceAddForm.style =
				'display:flex; gap:8px; align-items:center; background:#f9f9f9; padding:10px; border-radius:6px; border:1px solid #e0e0e0; margin-bottom:15px;';

			const newSpaceIdInput = document.createElement('input');
			newSpaceIdInput.type = 'text';
			newSpaceIdInput.placeholder = 'SpaceID';
			newSpaceIdInput.style =
				'padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; flex:1;';

			const newSpaceTextInput = document.createElement('input');
			newSpaceTextInput.type = 'text';
			newSpaceTextInput.placeholder = '表示名';
			newSpaceTextInput.style =
				'padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; flex:1;';

			const doAddSpaceBtn = document.createElement('button');
			doAddSpaceBtn.innerText = 'Spaceを追加';
			doAddSpaceBtn.style =
				'padding:6px 12px; background:#5cb85c; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;';

			doAddSpaceBtn.onclick = () => {
				const id = newSpaceIdInput.value.trim();
				const text = newSpaceTextInput.value.trim();
				if (!id) {
					window.alert('SpaceIDを入力してください。');
					return;
				}
				if (spacesData[id]) {
					window.alert('そのSpaceIDは既に存在します。');
					return;
				}
				spacesData[id] = {
					text: text || id,
					datas: [],
				};
				spaceOrder.push(id);
				newSpaceIdInput.value = '';
				newSpaceTextInput.value = '';
				renderSpaceRows();
			};

			spaceAddForm.appendChild(newSpaceIdInput);
			spaceAddForm.appendChild(newSpaceTextInput);
			spaceAddForm.appendChild(doAddSpaceBtn);
			spaceTabContent.appendChild(spaceAddForm);

			// 既存のSpace編集一覧
			const spaceListContainer = document.createElement('div');
			spaceListContainer.style =
				'flex:1; overflow-y:auto; padding-right:5px;';
			spaceTabContent.appendChild(spaceListContainer);

			const spaceHeader = document.createElement('div');
			spaceHeader.style =
				'display:flex; gap:5px; margin-bottom:8px; font-size:12px; font-weight:bold; color:#555; border-bottom:1px solid #eee; padding-bottom:4px; position:sticky; top:0; background:white;';
			spaceHeader.innerHTML =
				'<span style="width:20px;"></span><span style="flex:1;">SpaceID</span><span style="flex:1;">表示名</span><span style="width:60px;">操作</span>';
			spaceListContainer.appendChild(spaceHeader);

			const spaceRowsContainer = document.createElement('div');
			spaceListContainer.appendChild(spaceRowsContainer);

			// ドラッグ&ドロップによる並べ替え中のインデックスを保持
			let draggingSpaceIndex = null;

			function renderSpaceRows() {
				spaceRowsContainer.innerHTML = '';
				spaceOrder.forEach((spaceId, spaceIndex) => {
					const row = document.createElement('div');
					row.style =
						'display:flex; gap:5px; margin-bottom:8px; align-items:center;';
					row.draggable = true;

					row.ondragstart = (e) => {
						draggingSpaceIndex = spaceIndex;
						row.style.opacity = '0.4';
						e.dataTransfer.effectAllowed = 'move';
					};
					row.ondragend = () => {
						draggingSpaceIndex = null;
						row.style.opacity = '';
					};
					row.ondragover = (e) => {
						e.preventDefault();
						e.dataTransfer.dropEffect = 'move';
					};
					row.ondrop = (e) => {
						e.preventDefault();
						if (
							draggingSpaceIndex === null ||
							draggingSpaceIndex === spaceIndex
						)
							return;
						const [moved] = spaceOrder.splice(
							draggingSpaceIndex,
							1,
						);
						spaceOrder.splice(spaceIndex, 0, moved);
						draggingSpaceIndex = null;
						renderSpaceRows();
					};

					// ドラッグ用ハンドル（左端）
					const dragHandle = document.createElement('div');
					dragHandle.innerText = '⠿';
					dragHandle.title = 'ドラッグして並び替え';
					dragHandle.style =
						'width:20px; flex-shrink:0; text-align:center; cursor:grab; color:#888; font-size:14px; user-select:none;';
					row.appendChild(dragHandle);

					// SpaceID入力欄
					const idInput = document.createElement('input');
					idInput.type = 'text';
					idInput.value = spaceId;
					idInput.style =
						'flex:1; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;';

					let oldId = spaceId;
					idInput.onchange = () => {
						const newId = idInput.value.trim();
						if (!newId) {
							window.alert('SpaceIDを空にすることはできません。');
							idInput.value = oldId;
							return;
						}
						if (newId !== oldId && spacesData[newId]) {
							window.alert('そのSpaceIDは既に存在します。');
							idInput.value = oldId;
							return;
						}
						if (newId !== oldId) {
							spacesData[newId] = spacesData[oldId];
							delete spacesData[oldId];
							const orderIdx = spaceOrder.indexOf(oldId);
							if (orderIdx !== -1) {
								spaceOrder[orderIdx] = newId;
							}
							if (currentSpaceId === oldId) {
								currentSpaceId = newId;
							}
							oldId = newId;
							renderSpaceRows();
						}
					};

					// 表示名入力欄
					const textInput = document.createElement('input');
					textInput.type = 'text';
					textInput.value = spacesData[spaceId].text || '';
					textInput.style =
						'flex:1; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px;';
					textInput.oninput = () => {
						spacesData[spaceId].text = textInput.value.trim();
					};

					// 削除ボタン
					const delBtn = document.createElement('button');
					delBtn.innerText = '削除';
					delBtn.style =
						'width:60px; padding:6px; background:#ff4d4d; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;';
					delBtn.onclick = () => {
						if (spaceOrder.length <= 1) {
							window.alert(
								'これ以上Spaceを削除できません。最小1つのSpaceが必要です。',
							);
							return;
						}
						if (
							!window.confirm(
								`本当にSpace "${spaceId}" を削除しますか？\n内部のデータもすべて削除されます。`,
							)
						)
							return;
						delete spacesData[spaceId];
						const orderIdx = spaceOrder.indexOf(spaceId);
						if (orderIdx !== -1) spaceOrder.splice(orderIdx, 1);
						if (currentSpaceId === spaceId) {
							currentSpaceId = spaceOrder[0];
						}
						renderSpaceRows();
					};

					row.appendChild(idInput);
					row.appendChild(textInput);
					row.appendChild(delBtn);
					spaceRowsContainer.appendChild(row);
				});
			}

			const dataSpaceSelectContainer = document.createElement('div');
			dataSpaceSelectContainer.style =
				'display:flex; gap:10px; align-items:center; margin-bottom:15px; background:#f9f9f9; padding:10px; border-radius:6px; border:1px solid #e0e0e0;';
			dataTabContent.appendChild(dataSpaceSelectContainer);

			const spaceSelectLbl = document.createElement('label');
			spaceSelectLbl.innerText = '編集するSpace:';
			spaceSelectLbl.style = 'font-size:13px; font-weight:bold;';
			dataSpaceSelectContainer.appendChild(spaceSelectLbl);

			const spaceSelect = document.createElement('select');
			spaceSelect.style =
				'padding:6px; border-radius:4px; border:1px solid #ccc; font-size:13px; min-width:150px; flex:1;';
			dataSpaceSelectContainer.appendChild(spaceSelect);

			function updateSpaceSelectOptions() {
				spaceSelect.innerHTML = '';
				spaceOrder.forEach((spaceId) => {
					const opt = document.createElement('option');
					opt.value = spaceId;
					opt.innerText = `${spaceId} (${spacesData[spaceId].text || '表示名なし'})`;
					if (spaceId === currentSpaceId) opt.selected = true;
					spaceSelect.appendChild(opt);
				});
			}

			spaceSelect.onchange = () => {
				currentSpaceId = spaceSelect.value;
				renderDataRows();
			};

			// データリスト一覧表示エリア
			const listContainer = document.createElement('div');
			listContainer.style =
				'flex:1; overflow-y:auto; margin-bottom:15px; padding-right:5px;';
			dataTabContent.appendChild(listContainer);

			const header = document.createElement('div');
			header.style =
				'display:flex; gap:5px; margin-bottom:8px; font-size:12px; font-weight:bold; color:#555; position:sticky; top:0; background:white; padding-bottom:4px; border-bottom:1px solid #eee;';
			header.innerHTML =
				'<span style="width:20px;"></span><span style="flex:1;">DataID</span><span style="flex:1;">表示名</span><span style="flex:1;">タイプ</span><span style="flex:1.5;">初期値 / 値</span><span style="flex:0.5;">min</span><span style="flex:0.5;">max</span><span style="flex:0.6;">amount</span><span style="width:40px;"></span>';
			listContainer.appendChild(header);

			const rowsContainer = document.createElement('div');
			listContainer.appendChild(rowsContainer);

			// ドラッグ&ドロップによる並べ替え中のインデックスを保持
			let draggingDataIndex = null;

			function renderDataRows() {
				rowsContainer.innerHTML = '';
				const spaceData = spacesData[currentSpaceId];
				if (!spaceData) return;

				// ヘッダーは行ごとのmin/max表示切り替えに関わらず常に固定レイアウトにする。
				// (行側もnumber以外の時はmin/maxをvisibility:hiddenにして幅を保持するため、
				//  ヘッダーと各行の列位置は常に一致する)
				header.innerHTML =
					'<span style="width:20px;"></span><span style="flex:1;">DataID</span><span style="flex:1;">表示名</span><span style="flex:1;">タイプ</span><span style="flex:1.5;">初期値 / 値</span><span style="flex:0.5;">min</span><span style="flex:0.5;">max</span><span style="flex:0.6;">amount</span><span style="width:40px;"></span>';

				spaceData.datas.forEach((dataItem, index) => {
					const row = document.createElement('div');
					row.style =
						'display:flex; gap:5px; margin-bottom:8px; align-items:center;';
					row.draggable = true;

					row.ondragstart = (e) => {
						draggingDataIndex = index;
						row.style.opacity = '0.4';
						e.dataTransfer.effectAllowed = 'move';
					};
					row.ondragend = () => {
						draggingDataIndex = null;
						row.style.opacity = '';
					};
					row.ondragover = (e) => {
						e.preventDefault();
						e.dataTransfer.dropEffect = 'move';
					};
					row.ondrop = (e) => {
						e.preventDefault();
						if (
							draggingDataIndex === null ||
							draggingDataIndex === index
						)
							return;
						const [moved] = spaceData.datas.splice(
							draggingDataIndex,
							1,
						);
						spaceData.datas.splice(index, 0, moved);
						draggingDataIndex = null;
						renderDataRows();
					};

					// ドラッグ用ハンドル（左端）
					const dragHandle = document.createElement('div');
					dragHandle.innerText = '⠿';
					dragHandle.title = 'ドラッグして並び替え';
					dragHandle.style =
						'width:20px; flex-shrink:0; text-align:center; cursor:grab; color:#888; font-size:14px; user-select:none;';
					row.appendChild(dragHandle);

					const inputDataId = document.createElement('input');
					inputDataId.type = 'text';
					inputDataId.value = dataItem.id;
					inputDataId.placeholder = 'DataID';
					inputDataId.style =
						'flex:1; width:0; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
					inputDataId.oninput = () => {
						dataItem.id = inputDataId.value.trim();
					};

					const inputText = document.createElement('input');
					inputText.type = 'text';
					inputText.value = dataItem.text;
					inputText.placeholder = '表示名';
					inputText.style =
						'flex:1; width:0; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
					inputText.oninput = () => {
						dataItem.text = inputText.value.trim();
					};

					const selectType = document.createElement('select');
					selectType.style =
						'flex:1; width:0; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
					const types = [
						{ val: 'text', label: '文字列 (text)' },
						{ val: 'number', label: '数値 (number)' },
						{ val: 'boolean', label: '真偽値 (boolean)' },
						{ val: 'list', label: 'リスト (list)' },
					];
					types.forEach((t) => {
						const opt = document.createElement('option');
						opt.value = t.val;
						opt.innerText = t.label;
						if (t.val === dataItem.type) opt.selected = true;
						selectType.appendChild(opt);
					});

					const valueContainer = document.createElement('div');
					valueContainer.style =
						'flex:1.5; width:0; display:flex; align-items:center;';

					function updateValueInputUI(currentType, currentVal) {
						valueContainer.innerHTML = '';
						if (currentType === 'boolean') {
							const input = document.createElement('input');
							input.type = 'checkbox';
							input.checked =
								currentVal === true || currentVal === 'true';
							input.style =
								'margin:0 auto; width:16px; height:16px;';
							input.onchange = () => {
								dataItem.default = input.checked;
							};
							valueContainer.appendChild(input);
						} else if (currentType === 'list') {
							const textarea = document.createElement('textarea');
							textarea.style =
								'width:100%; height:40px; padding:4px; border:1px solid #ccc; border-radius:4px; font-size:12px; box-sizing:border-box; resize:vertical; font-family:sans-serif;';
							textarea.placeholder = '改行区切りで入力';
							if (Array.isArray(currentVal)) {
								textarea.value = currentVal.join('\n');
							} else {
								textarea.value =
									currentVal !== undefined ? currentVal : '';
							}
							textarea.oninput = () => {
								dataItem.default = textarea.value.split('\n');
							};
							valueContainer.appendChild(textarea);
						} else {
							const input = document.createElement('input');
							input.type =
								currentType === 'number' ? 'number' : 'text';
							input.value =
								currentVal !== undefined
									? Array.isArray(currentVal)
										? currentVal.join(',')
										: currentVal
									: '';
							input.placeholder = '値';
							input.style =
								'width:100%; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
							input.oninput = () => {
								dataItem.default =
									currentType === 'number'
										? input.value === ''
											? 0
											: Number(input.value)
										: input.value;
							};
							valueContainer.appendChild(input);
						}
					}

					// minとmax用の入力欄を追加
					const minInput = document.createElement('input');
					minInput.type = 'number';
					minInput.placeholder = 'min';
					minInput.value =
						dataItem.min !== undefined ? dataItem.min : '';
					minInput.style =
						'flex:0.5; width:0; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
					minInput.oninput = () => {
						dataItem.min =
							minInput.value === '' ? '' : Number(minInput.value);
					};

					const maxInput = document.createElement('input');
					maxInput.type = 'number';
					maxInput.placeholder = 'max';
					maxInput.value =
						dataItem.max !== undefined ? dataItem.max : '';
					maxInput.style =
						'flex:0.5; width:0; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
					maxInput.oninput = () => {
						dataItem.max =
							maxInput.value === '' ? '' : Number(maxInput.value);
					};

					// amount用の入力欄を追加（number専用: 1操作での変動量）
					const amountInput = document.createElement('input');
					amountInput.type = 'number';
					amountInput.placeholder = 'amount';
					amountInput.value =
						dataItem.amount !== undefined ? dataItem.amount : '';
					amountInput.style =
						'flex:0.6; width:0; padding:6px; border:1px solid #ccc; border-radius:4px; font-size:13px; box-sizing:border-box;';
					amountInput.oninput = () => {
						dataItem.amount =
							amountInput.value === ''
								? ''
								: Number(amountInput.value);
					};

					// number以外のデータ形式の場合min/max/amountを表示しない制御
					// (display:noneではなくvisibility:hiddenにすることで、
					//  レイアウト上の幅は保持し、ヘッダーとの列位置ズレを防ぐ)
					function updateMinMaxUI(currentType) {
						const isNumber = currentType === 'number';
						minInput.style.visibility = isNumber ? '' : 'hidden';
						maxInput.style.visibility = isNumber ? '' : 'hidden';
						amountInput.style.visibility = isNumber ? '' : 'hidden';
						if (!isNumber) {
							minInput.value = '';
							maxInput.value = '';
							amountInput.value = '';
							dataItem.min = '';
							dataItem.max = '';
							dataItem.amount = '';
						}
					}

					selectType.onchange = () => {
						dataItem.type = selectType.value;
						if (dataItem.type === 'boolean')
							dataItem.default = false;
						else if (dataItem.type === 'number')
							dataItem.default = 0;
						else if (dataItem.type === 'list')
							dataItem.default = [];
						else dataItem.default = '';
						updateValueInputUI(dataItem.type, dataItem.default);
						updateMinMaxUI(dataItem.type);
					};

					updateValueInputUI(dataItem.type, dataItem.default);
					updateMinMaxUI(dataItem.type);

					const delBtn = document.createElement('button');
					delBtn.innerText = '✕';
					delBtn.style =
						'width:40px; padding:6px; background:#ff4d4d; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; flex-shrink:0;';
					delBtn.onclick = () => {
						spaceData.datas.splice(index, 1);
						renderDataRows();
					};

					row.appendChild(inputDataId);
					row.appendChild(inputText);
					row.appendChild(selectType);
					row.appendChild(valueContainer);
					row.appendChild(minInput);
					row.appendChild(maxInput);
					row.appendChild(amountInput);
					row.appendChild(delBtn);
					rowsContainer.appendChild(row);
				});
			}

			// 項目(Data)追加ボタン
			const addBtn = document.createElement('button');
			addBtn.innerText = '+ 項目を追加';
			addBtn.style =
				'align-self:flex-start; padding:6px 12px; background:#5cb85c; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px; margin-bottom:15px;';
			addBtn.onclick = () => {
				if (!spacesData[currentSpaceId]) return;
				spacesData[currentSpaceId].datas.push({
					id: '',
					text: '',
					type: 'text',
					default: '',
					min: '',
					max: '',
					amount: '',
				});
				renderDataRows();
			};
			dataTabContent.appendChild(addBtn);

			// 初期起動時のデフォルト表示タブをSpace設定に指定
			setTab('space');

			// --- モーダル最下部の共通ボタンコンテナ ---
			const btnContainer = document.createElement('div');
			btnContainer.style =
				'display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #eee; padding-top:10px;';

			const cancelBtn = document.createElement('button');
			cancelBtn.innerText = 'キャンセル';
			cancelBtn.style =
				'padding:6px 12px; border:1px solid #ccc; border-radius:4px; background:#fff; cursor:pointer; font-size:13px;';
			cancelBtn.onclick = () => {
				backdrop.remove();
				resolve(null);
			};

			const saveBtn = document.createElement('button');
			saveBtn.innerText = '確定';
			saveBtn.style =
				'padding:6px 12px; background:#ff8a54; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;';
			saveBtn.onclick = () => {
				const result = {};
				for (const spaceId of spaceOrder) {
					const spaceData = spacesData[spaceId];
					if (!spaceData) continue;
					const sId = spaceId.trim();
					if (!sId) continue;

					result[sId] = {};
					if (spaceData.text) {
						result[sId].text = spaceData.text;
					}

					for (const dataItem of spaceData.datas) {
						const dId = dataItem.id.trim();
						if (dId) {
							let finalVal = dataItem.default;
							if (dataItem.type === 'number') {
								finalVal =
									finalVal === '' ? 0 : Number(finalVal);
							} else if (dataItem.type === 'boolean') {
								finalVal =
									finalVal === true || finalVal === 'true';
							} else if (dataItem.type === 'list') {
								if (!Array.isArray(finalVal)) {
									finalVal =
										typeof finalVal === 'string'
											? finalVal.split('\n')
											: [];
								}
							}
							result[sId][dId] = {
								text: dataItem.text,
								type: dataItem.type,
								default: finalVal,
							};

							// type: number の場合のみ min, max, amount プロパティを付与する
							if (dataItem.type === 'number') {
								if (
									dataItem.min !== '' &&
									dataItem.min !== undefined
								) {
									result[sId][dId].min = Number(dataItem.min);
								}
								if (
									dataItem.max !== '' &&
									dataItem.max !== undefined
								) {
									result[sId][dId].max = Number(dataItem.max);
								}
								if (
									dataItem.amount !== '' &&
									dataItem.amount !== undefined
								) {
									result[sId][dId].amount = Number(
										dataItem.amount,
									);
								}
							}
						}
					}
				}
				backdrop.remove();
				resolve(result);
			};

			btnContainer.appendChild(cancelBtn);
			btnContainer.appendChild(saveBtn);
			modal.appendChild(btnContainer);
			backdrop.appendChild(modal);
			document.body.appendChild(backdrop);
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