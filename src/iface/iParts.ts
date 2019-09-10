// Generated by https://quicktype.io

export interface PayloadPart {
    partId:   string;
    mimeType: string;
    filename: string;
    headers:  Header[];
    body:     Body;
}

export interface Body {
    size:          number;
    data?:         string;
    attachmentId?: string;
}

export interface Header {
    name:  string;
    value: string;
}