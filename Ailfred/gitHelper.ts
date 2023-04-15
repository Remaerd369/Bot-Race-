const https = require('https');
const fs = require('fs');

export class GitHelper {
    constructor(private repoUrl: string) {}

    clone(): string {
        const localPath = '/path/to/local/repo'; // Update this to actual path
        const repoName = (this.repoUrl.split('/').pop()?.replace('.git', '')) ?? 'defaultRepoName';
        const fullLocalPath = `${localPath}/${repoName}`;

        if (!fs.existsSync(fullLocalPath)) {
            fs.mkdirSync(fullLocalPath);
        }

        const req = https.request(`${this.repoUrl}/archive/refs/heads/master.tar.gz`, function (res: any) {
            const repoFile = fs.createWriteStream(`${fullLocalPath}/repo.tar.gz`);

            res.on('data', function (chunk: any) {
                repoFile.write(chunk);
            });

            res.on('end', function () {
                repoFile.end();
                const tar = require('tar');
                tar.extract({
                    file: `${fullLocalPath}/repo.tar.gz`,
                    cwd: fullLocalPath,
                    sync: true
                });
                fs.unlinkSync(`${fullLocalPath}/repo.tar.gz`);
            });
        });

        req.end();

        return fullLocalPath;
    }
}