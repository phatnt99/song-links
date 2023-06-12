import { Client } from "youtubei";
import {localeIncludes} from "locale-includes";

class CheckEngine {

    async check(keyword) {
        const youtube = new Client();
        try {
            var videos = await youtube.search(keyword + " karaoke", {
                type: "video", // video | playlist | channel | all
            });
            JSON.stringify(videos);
        } catch (err) {
            let filters = videos.items.map(vid => {
                return vid.title;
              });
           
            return filters ?? [];
        }
        return [];
    }

    async isValidSongName(keyword) {
        try {
            const allRelatedSongs = await this.check(keyword);
            console.log(allRelatedSongs);
            let result = allRelatedSongs.filter(song => {
                let santized = song.toLocaleLowerCase().replace('karaoke', '');
                santized = santized.replace("tone", "_");
                santized = santized.replace("|", "_");
                santized = santized.replace("-", "_");
                let chunk = santized.split("_");
                console.log("FOR " + song);
                console.log(chunk);
                for (let index = 0; index < chunk.length; index++) {
                    if (chunk[index].trim().normalize() == keyword.toLocaleLowerCase().trim().normalize()) {
                        return true;
                    }
                 }
                return false;
            });
            console.log(result);
            if (result.length > 0) return true;
        } catch (err) {
            return false;
        }
        return false;
    }
}

export default new CheckEngine();