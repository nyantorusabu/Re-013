// Name: Re:Laser
// ID: ReLaserExt
// Description: Re:Laser専用の拡張機能。Re:Laser以外で使用することは想定されていません。
// By: nyantorusabu

(async function (Scratch) {
    "use strict";

    // 変数定義
    const Mods = [];

    // ライブラリ読み込みとかその辺の関数
    async function Extension_Setup() {
        const loadNDT = () => {
            if (window.NDT) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = 'https://nyantorusabu.github.io/NDT/NekoDevTools.js';
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };
        const loadfflate = () => {
            if (window.fflate) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = 'https://unpkg.com/fflate@0.8.2';
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        await loadNDT();
        await loadfflate();

        // 画面ロック用
        NDT.NEve.Add('FLAG_AFTER', () => {
            NDT.VM.postIOData("keyboard", {
                key: ' ',
                isDown: true,
            });
        });
    }

    class ReLaserExt {
        getInfo() {
            return GenerateBlocksInfo(
                'ReLaserExt',
                'Re:Laser',
                blocks(
                    label('譜面関係'),
                    block(
                        'GetAllChart',
                        'R',
                        'すべての譜面'
                    ),
                    block(
                        'DeleteAllChart',
                        'C',
                        'すべての譜面/音源を削除'
                    ),
                    block(
                        'ImportFromScratch',
                        'C',
                        'PJID [ID] から譜面をインポート',
                        arg(
                            'ID',
                            'N',
                            '1179156622'
                        )
                    ),
                    block(
                        'ImportFromZIP',
                        'C',
                        'ProjectURL [URL] から譜面をインポート',
                        arg(
                            'URL',
                            'S',
                            'https://nyantorusabu.github.io/Re-013/Re：Laser.sb3'
                        )
                    ),
                    label('Mod関係'),
                    block(
                        'GetAllMods',
                        'R',
                        'すべてのMods'
                    ),
                    label('OPTION関係'),
                    block(
                        'DoOption',
                        'B',
                        '保存された設定がある'
                    ),
                    block(
                        'SaveOption',
                        'C',
                        '設定を保存'
                    ),
                    block(
                        'LoadOption',
                        'C',
                        '設定を読み込み'
                    ),
                    label('mainスプライト'),
                    block(
                        'mainVarList',
                        'R',
                        'mainスプライトのすべてのローカル変数'
                    ),
                    block(
                        'mainVarGet',
                        'R',
                        'mainスプライトのローカル変数 [VarID]',
                        arg(
                            'VarID',
                            'S',
                            'GAME.main'
                        )
                    ),
                    block(
                        'mainVarSet',
                        'C',
                        'mainスプライトのローカル変数 [VarID] を [Value] にする',
                        args(
                            arg(
                                'VarID',
                                'S',
                                'GAME.main'
                            ),
                            arg(
                                'Value',
                                'S',
                                'menu'
                            )
                        )
                    ),
                    block(
                        'mainListList',
                        'R',
                        'mainスプライトのすべてのローカルリスト'
                    ),
                    block(
                        'mainListGet',
                        'R',
                        'mainスプライトのローカルリスト [VarID] のArray',
                        arg(
                            'VarID',
                            'S',
                            'UI.button'
                        )
                    ),
                    block(
                        'mainListSet',
                        'C',
                        'mainスプライトのローカルリスト [VarID] を [Value] で置き換え',
                        args(
                            arg(
                                'VarID',
                                'S',
                                'UI.button'
                            ),
                            arg(
                                'Value',
                                'S',
                                '["りんご", "ごりら", "らっぱ"]'
                            )
                        )
                    ),
                    label('NDT'),
                    block(
                        'NDTVer',
                        'R',
                        'NDTのバージョン'
                    ),
                    block(
                        'NDTMessage',
                        'R',
                        'NDTの更新内容'
                    ),
                    label('その他'),
                    block(
                        'StartsW',
                        'R',
                        '[JSON] の中で [TEXT] から始まるすべての要素',
                        args(
                            arg(
                                'JSON',
                                'S',
                                '["りんご", "ごりら", "らっぱ"]'
                            ),
                            arg(
                                'TEXT',
                                'S',
                                'ご'
                            )
                        )
                    )
                )
            )
        }



        // ブロックの定義
        // 譜面
        GetAllChart() {
            return _AllChart();
        }
        DeleteAllChart() {
            for(const now of NDT.Spr.Ast.Sou.IDList('MUSIC')) {
                NDT.Spr.Ast.Sou.Delete('MUSIC', now);
            }
            NDT.List.Get('譜面データ/charts').length = 0;
        }
        async ImportFromScratch(args) {
            await _ImportChart('SC', args.ID);
        }
        async ImportFromZIP(args) {
            await _ImportChart('ZIP', args.URL)
        }
        // Mod
        GetAllMods() {
            return JSON.stringify(Mods);
        }
        // 干渉
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
        DoOption() {
            return (localStorage.getItem('re-save') !== null)
        }
        SaveOption() {
            const Options = NDT.Spr.Var.NameList('main').filter(v => v.startsWith('OPTION'));
            const Data = Object.fromEntries(Options.map(v => [v, NDT.Spr.Var.Get('main', v)]));
            localStorage.setItem('re-save', JSON.stringify(Data));
        }
        LoadOption() {
            if (!localStorage.getItem('re-save')) return;

            const Data = JSON.parse(localStorage.getItem('re-save'));
            for(const op of Object.entries(Data)) {
                NDT.Spr.Var.Set('main', op[0], op[1])
            }
        }
        // NDT
        NDTVer() {
            return NDT.Info.Ver;
        }
        NDTMessage() {
            return NDT.Info.Message;
        }
        // その他
        StartsW(args) {
            return JSON.stringify(JSON.parse(args.JSON).filter(v => v.startsWith(args.TEXT)));
        }
    }


    // ブロック用関数
    function _AllChart() {
        return NDT.List.Get('譜面データ/charts').filter((c) => c.startsWith('#')).map((c) => c.slice(1).split('/')[0]);
    }
    function _toDataURL(DATA) {
        return `data:application/octet-stream;base64,${DATA.toBase64()}`
    }
    // 譜面をインポートする関数
    async function _ImportChart(MODE = 'sc', SRC) {
        function getVar(target) {
            return Object.fromEntries(Object.values(target.variables));
        }
        function getList(target) {
            return Object.fromEntries(Object.values(target.lists));
        }

        const Mode = MODE.toLowerCase()
        let PJ;
        if (Mode == 'sc') {
            const resData = await fetch(`https://trampoline.turbowarp.org/api/projects/${SRC}`);
            const PJData = await resData.json();
            const res = await fetch(`https://projects.scratch.mit.edu/${SRC}?token=${PJData.project_token}`);
            PJ = await res.json()
        } else if (Mode == 'zip') {
            const res = await fetch(SRC);
            const data = await res.arrayBuffer();
            const PJZip = fflate.unzipSync(data);
            PJ = JSON.parse(fflate.strFromU8(PJZip[project.json]))
        }

        const targets = PJ.targets;

        const main = targets.filter((t) => t.name == 'main')[0];
        const music = targets.filter((t) => t.name == 'MUSIC')[0];
        const stage = targets.filter((t) => t.isStage)[0];
        const is_old = Object.keys(getVar(main)).includes('Editor-TIM');

        const chartsAll = Object.keys(getList(stage)).includes('譜面データ/charts') ? getList(stage)['譜面データ/charts'] : getList(main).songsdata;
        const soundsAll = music ? music.sounds : main.sounds;
        const sounds = {};
        for(const now of soundsAll) {
            sounds[now.name] = now.md5ext;
        }
        const costumes = main.costumes;

        const InstallModList = [];
        const LCcharts = NDT.List.Get('譜面データ/charts');
        let skip = false;
        let title = '';
        for(const now of chartsAll) {
            const spl = now.split('/')
            if(now.startsWith('#')) {
                const name = spl[0].slice(1);
                skip = LCcharts.includes(now);
                title = name;
                if(!(skip || NDT.Spr.Ast.Sou.NameList('MUSIC').includes(now))) {
                    let url;
                    if (Mode == 'zip' && Object.keys(PJZip).includes(sounds[name])) {
                        url = _toDataURL(PJZip[sounds[name]]);
                    } else {
                        url = `https://assets.scratch.mit.edu/internalapi/asset/${sounds[name]}/get`
                    }
                    await NDT.Spr.Ast.Sou.Add('MUSIC', name, url);
                }
            }
            if(!skip) {
                if (spl[0].toLowerCase() == 'mod') {
                    InstallModList.push(spl[1]);
                    Mods.push({
                        id: spl[1],
                        chart: title
                    })
                }
                if (is_old && typeof spl[0] == 'number') {
                    const note = now.spl;
                    note[2] = note[2] * 2;
                    LCcharts.push(note.join('/'));
                } else {
                    LCcharts.push(now);
                }
            }
        }
        for(const now of costumes) {
            if(!NDT.Spr.Ast.Cos.NameList('main').includes(now.name)) {
                let url;
                if (Mode == 'zip' && Object.keys(PJZip).includes(now.md5ext)) {
                    url = _toDataURL(PJZip[now.md5ext]);
                } else {
                    url = `https://assets.scratch.mit.edu/internalapi/asset/${now.md5ext}/get`
                }
                await NDT.Spr.Ast.Cos.Add('main', now.name, url);
            }
        }

        for(const now of targets) {
            if(!(now.isStage || NDT.Spr.NameList.includes(now.name))) {
                const messages = Object.values(now.blocks).filter((b) => b.opcode == 'event_whenbroadcastreceived').map((b) => b.fields.BROADCAST_OPTION[0]);
                let install = false;
                for(const tnow of InstallModList) {
                    if (messages.includes(tnow)) {
                        install = true;
                        Mods.filter((m) => m.id = tnow)[0].sprite = now.name;
                        break;
                    };
                }
                if (!install) continue;
                const SPZip = {
                    'sprite.json': fflate.strToU8(JSON.stringify(now))
                }
                for(const tnow of now.costumes) {
                    let url;
                    if (Mode == 'zip' && Object.keys(PJZip).includes(tnow.md5ext)) {
                        url = _toDataURL(PJZip[tnow.md5ext]);
                    } else {
                        url = `https://assets.scratch.mit.edu/internalapi/asset/${tnow.md5ext}/get`
                    }
                    const res = await fetch(url);
                    const data = await res.arrayBuffer();
                    SPZip[tnow.md5ext] = data;
                };
                for(const tnow of now.sounds) {
                    let url;
                    if (Mode == 'zip' && Object.keys(PJZip).includes(tnow.md5ext)) {
                        url = _toDataURL(PJZip[tnow.md5ext]);
                    } else {
                        url = `https://assets.scratch.mit.edu/internalapi/asset/${tnow.md5ext}/get`
                    }
                    const res = await fetch(url);
                    const data = await res.arrayBuffer();
                    SPZip[tnow.md5ext] = data;
                };
                await NDT.Spr.Add(_toDataURL(fflate.zipSync(SPZip, {
                    level: 0
                })))
            }
        }
        NDT.Eve.Flag();
    }


    // NyankoExtensionCreater
    // 短縮表現変換
    function abbreviation(code, ...link) {
        for(const word of link) {
            if (code.toLowerCase().startsWith(word.toLowerCase()[0])) {
                return word;
            }
        }
        log('w', `引数として想定されていない値が入力されました: ${code}`)
        return code;
    }
    // ログ
    function log(type = 'log', output) {
        const lstype = abbreviation(
            type,
            'log',
            'warn',
            'error'
        )
        console[lstype](`[NEC] ${output}`)
    }
    // 型チェック
    function chktype(data, type) {
        if (typeof data !== type) {
            log('e', `引数に指定できない型が指定されています!: 入力=>${typeof data} 要求=>${type}`)
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
                blocks: blocks
            },
            ...option
        }
    }
    // ラベル
    function label(labeltext) {
        chktype(labeltext, 'string')
        return { blockType: 'label', text: labeltext }
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
            'EVENT'
        )

        // argsの確認
        const allblockargs = text.match(/\[(.*?)\]/g)?.map(s => s.slice(1, -1)) || [];
        const allinputargs = Object.keys(args);
        for (const chk of allblockargs) {
            if (!allinputargs.includes(chk)) {
                log('w', `block"${opcode}"に必要なargが渡されていません: ${chk}`);
            }
        }
        for (const chk of allinputargs) {
            if (!allblockargs.includes(chk)) {
                log('w', `block"${opcode}"に不必要なargが渡されています: ${chk}`);
            }
        }
        return {
            opcode: opcode,
            blockType: Scratch.BlockType[lstype],
            text: text,
            arguments: args
        }
    }
    function blocks(...blocks) {
        chktype(blocks, 'object');
        return blocks
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
            'COLOR'
        )
        return {
            [id]: {
                type: Scratch.ArgumentType[lstype],
                defaultValue: def,
                menu: menu
            }
        }
    }
    function args(...args) {
        chktype(args, 'object');
        return Object.assign({}, ...args);
    }

    // セットアップを実行してから拡張機能を認証
    await Extension_Setup();
    Scratch.extensions.register(new ReLaserExt());
})(Scratch);