import { Injectable } from "@nestjs/common";
import { AllowedExtensions } from "./allow.extension";

@Injectable()
export class KindUtil {

    constructor() {
    }

    getKind(type: string) {
        if (AllowedExtensions.image.indexOf(type) !== -1) {
            return "image";
        } else if (AllowedExtensions.audio.indexOf(type) !== -1) {
            return "audio";
        } else if (AllowedExtensions.video.indexOf(type) !== -1) {
            return "video";
        } else if (AllowedExtensions.document.indexOf(type) !== -1) {
            return "document";
        } else {
            return "file";
        }
    }

    isImage(type: string) {
        return AllowedExtensions.image.indexOf(type) !== -1;
    }
}
