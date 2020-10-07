import {RestApiService} from './rest-api.service';

describe('Rest API Service', () => {
    it('parses the API Base on construction', () => {
        const restApiService = new RestApiService(jasmine.createSpyObj('HttpClient', ['get']), 'http://example.com/api/');
        expect(restApiService.getRestApiBase()).toEqual('http://example.com/api');
    });
})
