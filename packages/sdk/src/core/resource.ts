// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import type { Velix } from "../client";

export abstract class APIResource {
	protected _client: Velix;

	constructor(client: Velix) {
		this._client = client;
	}
}
