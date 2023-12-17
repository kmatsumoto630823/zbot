※まだ準備中
# zBot
VOICEVOXを利用したDiscord用読み上げ（TTS）Bot

※VOICEVOXは付属しません、自分度用意しましょう

# Description（スラッシュコマンド）
/connect
　・・・zBotを接続します
/list
　・・・話者IDの一覧を表示します
/speaker
　・・・話者を変更します
/random
　・・・話者をランダムに変更します
/dict
　・・・単語または絵文字の読みを辞書登録します
/reaction
　・・・リアクションスタンプ読み上げの有効・無効を切り替えます
/gpt3prompt
　・・・ChatGPTに質問します（実験的おまけ機能）
/export
　・・・zBotの設定をエクスポートします
/disconnect
　・・・zBotを切断します
/help
　・・・ヘルプを表示します

# Dependencies
- Node.js v18
- npm install で下記を導入
  - "@discordjs/opus"
  - "@discordjs/voice"
  - "axios"
  - "discord.js"
  - "dotenv"
  - "ffmpeg-static"
  - "openai"
  - "sodium"

# Author
kmatsumoto630823

k.matsumoto.s630823@gmail.com

何かありましたらこのメール宛てにでも

# License
MIT License

詳細はLicenseファイルをお読みください

