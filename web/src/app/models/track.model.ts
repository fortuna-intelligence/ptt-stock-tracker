class Price {
    date: Date;
    price: number;
}

export class Track {
    user_id: string;
    timestamp: Date;
    symbol_id: string;
    symbol_name: string;
    content: string;
    url: string;
    prices: Price[];
    performance: number;
}