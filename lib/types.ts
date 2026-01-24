import { UIDataTypes, UIMessage, UITools } from "ai";

export type Attachment = {
	name: string;
	url: string;
	contentType: string;
};

export type Message = UIMessage<unknown, UIDataTypes, UITools>;
