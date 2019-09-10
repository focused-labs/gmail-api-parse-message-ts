declare var require: any;
const b64Decode = require('base-64').decode;

import { iGmail } from './iface/iGmail';
import { PayloadPart } from './iface/iParts';

/** parses gmail api response to a IGmail object - typescript */

export class ParseGmailApi {

    /** Decodes a URLSAFE Base64 string to its original representation */
    urlB64Decode(s: string): string {
        return s ? decodeURIComponent(escape(b64Decode(s.replace(/\-/g, '+').replace(/\_/g, '/')))) : '';
    }

    private indexHeaders(headers: any) {
        const result = new Map<string, string>();
        headers.forEach((v: any) => {
            let value = result.get(v.name.toLowerCase());
            if (!value) {
                value = '';
            }
            result.set(v.name.toLowerCase(), value + v.value);
        })
        return result;
    }

    /** Parses Gmail API response to a iGmail object  */
    public parseMessage(gmailApiResp: any): iGmail {

        const result: iGmail = {
            id: gmailApiResp.id,
            threadId: gmailApiResp.threadId,
            labelIds: gmailApiResp.labelIds,
            snippet: gmailApiResp.snippet,
            historyId: gmailApiResp.historyId,
            internalDate: -1,
            headers: new Map<string, string>(),
            textHtml: '',
            textPlain: '',
            attachments: []
        };
        if (gmailApiResp.internalDate) {
            result.internalDate = parseInt(gmailApiResp.internalDate);
        }

        const payload = gmailApiResp.payload;
        if (!payload) {
            return result;
        }

        let headers = this.indexHeaders(payload.headers);
        result.headers = headers;

        let parts = [payload];
        let firstPartProcessed = false;

        while (parts.length !== 0) {
            const part = parts.shift();
            if (part.parts) {
                parts = parts.concat(part.parts);
            }
            if (firstPartProcessed) {
                headers = this.indexHeaders(part.headers);
            }
            if (!part.body) {
                continue;
            }

            const contentDisposition = headers.get('content-disposition');
            const isHtml = part.mimeType && part.mimeType.indexOf('text/html') !== -1;
            const isPlain = part.mimeType && part.mimeType.indexOf('text/plain') !== -1;
            const isAttachment = (part as PayloadPart).body.attachmentId !== undefined;
            const isInline = contentDisposition && contentDisposition.indexOf('inline') !== -1;

            if (isHtml && !isAttachment) {
                result.textHtml = this.urlB64Decode(part.body.data);
            } else if (isPlain && !isAttachment) {
                result.textPlain = this.urlB64Decode(part.body.data);
            } else if (isAttachment) {
                const body = part.body;
                if (!result.attachments) {
                    result.attachments = [];
                }
                result.attachments.push({
                    filename: part.filename,
                    mimeType: part.mimeType,
                    size: body.size,
                    attachmentId: body.attachmentId,
                    headers: this.indexHeaders(part.headers)
                });
            } else if (isInline) {
                const body = part.body;
                if (!result.inline) {
                    result.inline = [];
                }
                result.inline.push({
                    filename: part.filename,
                    mimeType: part.mimeType,
                    size: body.size,
                    attachmentId: body.attachmentId,
                    headers: this.indexHeaders(part.headers)
                });
            }
            firstPartProcessed = true;
        }
        return result;
    };
}