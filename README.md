※名称が有名なマルウェアとかぶってるので変更を検討中  

# zBot
音声変換にVOICEVOXを利用したDiscord用読み上げ（TTS）Bot  
複数のサーバー（ギルド）でも動作するように設計してますが、基本はサーバーごとにBotを用意してください  
VOICEVOXエンジン側は大量のリクエストを想定していないので、パブリックに公開する用途で使う場合は冗長化するなりLB挟むなりして各自対策してください

※VOICEVOXのエンジンは付属しません、各自で用意してください  
※DiscordのBotアカウントも各自で用意してください  

# Help(slach commnad)
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
/export  
　・・・zBotの設定をエクスポートします  
/disconnect  
　・・・zBotを切断します  
/help  
　・・・ヘルプを表示します  

# Dependencies
- Node.js v20
- npm install で下記を導入
  - "@discordjs/opus"
  - "@discordjs/voice"
  - "axios"
  - "discord.js"
  - "dotenv"
  - "ffmpeg-static"
  - "sodium"

# INSTALL
node.jsが実行できる環境を用意してください  
プロジェクトフォルダを用意して上記の依存するモジュールをnpmで導入してください  
プロジェクトフォルダにファイル一式をコピーしてください  
env_sampleを参考にご自分の環境にあった.envをプロジェクトフォルダのトップに作成してください  
ディレクトリ「guild_configs」と「guild_dictionaries」をプロジェクトフォルダのトップに作成してください  
node zBot.jsでBotを実行してください

# Author
kmatsumoto630823

k.matsumoto.s630823@gmail.com

何かありましたらこのメール宛てにでも

# License
MIT License

詳細はLicenseファイルをお読みください

