// Name: Re:Laser
// ID: ReLaserExt
// Description: Re:Laser専用のアドオン。Re:Laser以外で使用することは想定されていません。
// By: nyantorusabu

(function (Scratch) {
    "use strict";

    const loadNDT = () => {
        if (window.NDT) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = 'https://nyantorusabu.github.io/NekoExtensions/NDT/NekoDevTools.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

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

    class ReLaserExt {
        constructor() {
            // 拡張機能の初期化時にライブラリ読み込みを開始し、そのPromiseを保存する
            this.NDTPromise = loadNDT().catch(err => {
                console.error("NDTの読み込みに失敗しました: ", err);
                // エラーを再スローして、awaitで捕捉できるようにする
                throw err;
            });
        }

        getInfo() {
            return GenerateBlocksInfo(
                'ReLaserExt',
                'Re:Laser',
                blocks(
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
        // 干渉
        async mainVarList() {
            await this.NDTPromise;
            if (!window.NDT) return false;

            return JSON.stringify(NDT.Spr.Var.NameList('main'));
        }
        async mainVarGet(args) {
            await this.NDTPromise;
            if (!window.NDT) return false;

            return String(NDT.Spr.Var.Get('main', args.VarID));
        }
        async mainVarSet(args) {
            await this.NDTPromise;
            if (!window.NDT) return false;

            NDT.Spr.Var.Set('main', args.VarID, args.Value);
        }
        async mainListList() {
            await this.NDTPromise;
            if (!window.NDT) return false;

            return JSON.stringify(NDT.Spr.List.NameList('main'));
        }
        async mainListGet(args) {
            await this.NDTPromise;
            if (!window.NDT) return false;

            return JSON.stringify(NDT.Spr.List.Get('main', args.VarID));
        }
        async mainListSet(args) {
            await this.NDTPromise;
            if (!window.NDT) return false;

            const List = NDT.Spr.List.Get('main', args.VarID);
            List.length = 0;
            List.push(...JSON.parse(args.Value));
        }
        // 設定
        async DoOption() {
            await this.NDTPromise;
            if (!window.NDT) return false;

            return (localStorage.getItem('re-save') !== null)
        }
        async SaveOption() {
            await this.NDTPromise;
            if (!window.NDT) return;

            const Options = NDT.Spr.Var.NameList('main').filter(v => v.startsWith('OPTION'));
            const Data = Object.fromEntries(Options.map(v => [v, NDT.Spr.Var.Get('main', v)]));
            localStorage.setItem('re-save', JSON.stringify(Data));
        }
        async LoadOption() {
            await this.NDTPromise;
            if (!window.NDT) return;

            if (!localStorage.getItem('re-save')) return;

            const Data = JSON.parse(localStorage.getItem('re-save'));
            for(const op of Object.entries(Data)) {
                NDT.Spr.Var.Set('main', op[0], op[1])
            }
        }
        // NDT
        async NDTVer() {
            await this.NDTPromise;
            if (!window.NDT) return;

            return NDT.Info.Ver;
        }
        async NDTMessage() {
            await this.NDTPromise;
            if (!window.NDT) return;

            return NDT.Info.Message;
        }
        // その他
        StartsW(args) {
            return JSON.stringify(JSON.parse(args.JSON).filter(v => v.startsWith(args.TEXT)));
        }
    }
    Scratch.extensions.register(new ReLaserExt());
})(Scratch);