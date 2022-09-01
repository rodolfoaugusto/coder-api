

import { Construct } from 'constructs'

export interface CEPProperties {
  readonly state: string
  readonly city: string
  readonly district: string
  readonly address: string
}

class CEP  {
    constructor(scope: Construct, id: string, props: CEPProperties) {
        const { state, 
        city, 
        district,
        address,
        country
        } = props
    }

    get () {
        const cepAPIUrl: string[] = process.env.CEP_API_URL.split(',');
        const cepAPICorreios = cepAPIUrl[0];
        const cepAPImain = `${cepAPIUrl[1]}?code=${cep}`;
        const cepAPIsecondary = `${cepAPIUrl[2]}?code=${cep}`;
        let getCEP = {};

        const data = new FormData();
        data.append('pagina', '/app/endereco/index.php');
        data.append('endereco', cep);
        data.append('cepaux', '');
        data.append('mensagem_alerta', '');
        data.append('tipoCEP', 'ALL');

        const cepCorreios = {
            method: 'post',
            url: cepAPICorreios,
            headers: {
                ...data.getHeaders(),
            },
            data: data,
        };

        try {
            getCEP = await axios(cepCorreios).then(async ({ data }) => {
                if (data.erro == false) {
                    const dataCorreios = data.dados[0]
                    if (await getAvailability(dataCorreios.localidade)) {
                        const dataJSON = {
                            status: 200,
                            state: dataCorreios.uf,
                            city: dataCorreios.localidade,
                            district: dataCorreios.bairro,
                            address: dataCorreios.logradouroDNEC,
                        }
                        await Cache.set(bucketCEPName, cacheRef, JSON.stringify(dataJSON));
                        return dataJSON;
                    } else {
                        return returnAPIerror(401, 1);
                    }
                } else if (data.statusText == 'bad_request') {
                    if (data.message == 'Blocked by flood') throw new Error('flood');
                } else {
                    return returnAPIerror(400, 1);
                }
            });
        } catch (error) {    
        }
}