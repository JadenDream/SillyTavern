import { getBase64Async } from '../../utils.js';

var 
    // 聲音列表 分為 name 和 id
    fishAudioVoices = [
        { name: '茜特菈莉', id: 'b244831ba8674c36a25c3a903be6f034' },
        { name: '八重神子', id: 'daea7df5ac1c4a7fa50a3ce21200b8cf' },
        { name: '雷神', id: '39e2212deca147eabdbd88ebd0189b1c' },
    ]

class FishAudioTtsProvider {
    //########//
    // Config //
    //########//

    ready = false;
    voices = [];
    separator = ' . ';
    audioElement = document.createElement('audio');

    defaultSettings = {
        // 修正端點路徑 - 移除 /v1/tts，讓 proxy server 處理完整路徑
        provider_endpoint: 'http://127.0.0.1:8080/v1/tts',
        model: 's1',
        chunk_length: 200,
        format: 'mp3',
        mp3_bitrate: 128,
        normalize: true,
        latency: 'normal',
        reference_audio_file: '',
        reference_text: '',
        reference_id: 'b244831ba8674c36a25c3a903be6f034',
        voiceMap: {},
    };

    settings = this.defaultSettings;

    get settingsHtml() {
        // 加入可以選擇聲音的下拉選單
        let voiceOptions = fishAudioVoices.map(voice => {
            return `<option value="${voice.id}" ${this.settings.reference_id === voice.id ? 'selected' : ''}>${voice.name}</option>`;
        }).join('');

        let html = `
        <div class="flex-container">
            <div class="menu_button menu_button_icon" id="fish_audio_connect" title="Test API connection">
                <i class="fa-solid fa-plug"></i>
            </div>
        </div>
        
        <label for="fish_audio_endpoint">API Endpoint</label>
        <input id="fish_audio_endpoint" type="text" class="text_pole" maxlength="250" value="${this.settings.provider_endpoint}"/>
        
        <label for="fish_audio_model">Model</label>
        <select id="fish_audio_model">
            <option value="s1" ${this.settings.model === 's1' ? 'selected' : ''}>S1</option>
            <option value="speech-1.6" ${this.settings.model === 'speech-1.6' ? 'selected' : ''}>Speech 1.6</option>
        </select>

        <label for="fish_audio_reference_id">Voice</label>
        <select id="fish_audio_reference_id">
            ${voiceOptions}
        </select>

        <label for="fish_audio_format">Audio Format</label>
        <select id="fish_audio_format">
            <option value="mp3" ${this.settings.format === 'mp3' ? 'selected' : ''}>MP3</option>
            <option value="wav" ${this.settings.format === 'wav' ? 'selected' : ''}>WAV</option>
            <option value="pcm" ${this.settings.format === 'pcm' ? 'selected' : ''}>PCM</option>
        </select>
        
        <label for="fish_audio_mp3_bitrate">MP3 Bitrate</label>
        <select id="fish_audio_mp3_bitrate">
            <option value="64" ${this.settings.mp3_bitrate === 64 ? 'selected' : ''}>64</option>
            <option value="128" ${this.settings.mp3_bitrate === 128 ? 'selected' : ''}>128</option>
            <option value="192" ${this.settings.mp3_bitrate === 192 ? 'selected' : ''}>192</option>
        </select>
        
        <label for="fish_audio_chunk_length">Chunk Length (100-300)</label>
        <input id="fish_audio_chunk_length" type="number" min="100" max="300" value="${this.settings.chunk_length}"/>
        
        <label for="fish_audio_latency">Latency Mode</label>
        <select id="fish_audio_latency">
            <option value="normal" ${this.settings.latency === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="balanced" ${this.settings.latency === 'balanced' ? 'selected' : ''}>Balanced</option>
        </select>
        
        <label>
            <input id="fish_audio_normalize" type="checkbox" ${this.settings.normalize ? 'checked' : ''} />
            Normalize Text
        </label>
        
        <hr>
        <h4>Reference Audio (Optional)</h4>
        <div class="flex-container">
            <input id="fish_audio_reference_file" type="file" accept="audio/*" class="flex1">
            <div class="menu_button menu_button_icon" id="fish_audio_upload_reference" title="Upload reference audio">
                <i class="fa-solid fa-upload"></i>
            </div>
        </div>
        
        <label for="fish_audio_reference_text">Reference Text</label>
        <input id="fish_audio_reference_text" type="text" class="text_pole" value="${this.settings.reference_text}" placeholder="Text corresponding to reference audio"/>
        

        
        <small>Use either reference audio file + text OR reference ID from fish.audio</small>
        `;
        return html;
    }

    async loadSettings(settings) {
        console.info('Fish Audio: Loading settings');
        this.settings = this.defaultSettings;

        // Set up event listeners
        $('#fish_audio_api_key').on('input', () => this.onSettingsChange());
        $('#fish_audio_endpoint').on('input', () => this.onSettingsChange());
        $('#fish_audio_model').on('change', () => this.onSettingsChange());
        $('#fish_audio_format').on('change', () => this.onSettingsChange());
        $('#fish_audio_mp3_bitrate').on('change', () => this.onSettingsChange());
        $('#fish_audio_chunk_length').on('input', () => this.onSettingsChange());
        $('#fish_audio_latency').on('change', () => this.onSettingsChange());
        $('#fish_audio_normalize').on('change', () => this.onSettingsChange());
        $('#fish_audio_reference_text').on('input', () => this.onSettingsChange());
        $('#fish_audio_reference_id').on('input', () => this.onSettingsChange());

        $('#fish_audio_connect').on('click', () => this.checkReady());
        $('#fish_audio_upload_reference').on('click', () => this.uploadReferenceAudio());

        console.info('Fish Audio: Settings loaded');
    }

    onSettingsChange() {
        console.info('Fish Audio: Settings changed, saving...');
        this.settings.provider_endpoint = $('#fish_audio_endpoint').val();
        this.settings.model = $('#fish_audio_model').val();
        this.settings.format = $('#fish_audio_format').val();
        this.settings.mp3_bitrate = parseInt($('#fish_audio_mp3_bitrate').val());
        this.settings.chunk_length = parseInt($('#fish_audio_chunk_length').val());
        this.settings.latency = $('#fish_audio_latency').val();
        this.settings.normalize = $('#fish_audio_normalize').is(':checked');
        this.settings.reference_text = $('#fish_audio_reference_text').val();
        this.settings.reference_id = $('#fish_audio_reference_id').val();

        // Save settings
        if (typeof this.saveTtsProviderSettings === 'function') {
            this.saveTtsProviderSettings();
        }
    }

    // 使用 XMLHttpRequest 進行 API 調用
    async makeXHRRequest(requestData, expectBlob = true, customEndpoint = null) {
        const endpoint = customEndpoint || this.settings.provider_endpoint;
        
        console.log('Fish Audio: Making XHR request...');
        console.log('Fish Audio: Request data:', requestData);
        console.log('Fish Audio: Endpoint:', endpoint);
        console.log('Fish Audio: Model:', this.settings.model);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // 設置請求
            xhr.open('POST', endpoint, true);
            
            // 重要：設置所有必要的 headers
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('model', this.settings.model);
            
            // 設置回應類型
            if (expectBlob) {
                xhr.responseType = 'blob';
            } else {
                xhr.responseType = 'json';
            }

            xhr.timeout = 60000; // 增加到 60秒超時

            xhr.onload = () => {
                console.log('Fish Audio: XHR onload triggered');
                console.log('Fish Audio: Status:', xhr.status);
                console.log('Fish Audio: Ready state:', xhr.readyState);
                
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('Fish Audio: Request successful');
                    resolve({
                        ok: true,
                        status: xhr.status,
                        blob: () => Promise.resolve(xhr.response),
                        arrayBuffer: () => Promise.resolve(xhr.response),
                        json: () => Promise.resolve(xhr.response)
                    });
                } else {
                    console.error('Fish Audio: HTTP error:', xhr.status, xhr.statusText);
                    console.error('Fish Audio: Response:', xhr.response);
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            };

            xhr.onerror = (event) => {
                console.error('Fish Audio: XHR network error');
                console.error('Fish Audio: Error event:', event);
                console.error('Fish Audio: XHR status:', xhr.status);
                console.error('Fish Audio: XHR ready state:', xhr.readyState);
                reject(new Error('Network error - failed to connect to Fish Audio API'));
            };

            xhr.ontimeout = () => {
                console.error('Fish Audio: XHR timeout');
                reject(new Error('Request timeout'));
            };

            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    console.log('Fish Audio: Download progress:', percentComplete.toFixed(2) + '%');
                }
            };

            // 發送請求前先檢查網路狀態
            if (!navigator.onLine) {
                reject(new Error('No internet connection'));
                return;
            }

            // 發送請求
            try {
                const requestBody = JSON.stringify(requestData);
                console.log('Fish Audio: Sending request body:', requestBody);
                xhr.send(requestBody);
            } catch (error) {
                console.error('Fish Audio: Error sending request:', error);
                reject(error);
            }
        });
    }

    async checkReady() {
        console.info('Fish Audio: Checking connection status');

        try {
            // 使用 fetch API 來測試連接
            const response = await fetch(this.settings.provider_endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'model': this.settings.model
                },
                body: JSON.stringify({
                    "text": "test",
                    "chunk_length": 100,
                    "format": this.settings.format,
                    "mp3_bitrate": this.settings.mp3_bitrate,
                    "references": [],
                    "reference_id": this.settings.reference_id,
                    "normalize": false,
                    "latency": this.settings.latency
                })
            });

            console.log('Fish Audio: Connection test response status:', response.status);

            if (response.status === 401) {
                console.warn('Fish Audio: Invalid API key');
                $('#fish_audio_connect').removeClass('success').addClass('failure');
                this.ready = false;
                return false;
            }

            if (response.ok || response.status === 200) {
                console.info('Fish Audio: Connection successful');
                $('#fish_audio_connect').removeClass('failure').addClass('success');
                this.ready = true;
                return true;
            } else {
                console.warn('Fish Audio: Connection failed with status:', response.status);
                $('#fish_audio_connect').removeClass('success').addClass('failure');
                this.ready = false;
                return false;
            }
        } catch (error) {
            console.error('Fish Audio: Connection test failed:', error);
            $('#fish_audio_connect').removeClass('success').addClass('failure');
            this.ready = false;
            return false;
        }
    }

    async uploadReferenceAudio() {
        const fileInput = document.getElementById('fish_audio_reference_file');
        if (!fileInput) {
            console.error('Reference file input not found');
            return;
        }

        const file = fileInput.files[0];
        if (!file) {
            if (typeof toastr !== 'undefined') {
                toastr.warning('Please select an audio file first');
            }
            return;
        }

        try {
            const audioData = await getBase64Async(file);
            this.settings.reference_audio_file = audioData;
            if (typeof toastr !== 'undefined') {
                toastr.success('Reference audio uploaded successfully');
            }
            if (typeof this.saveTtsProviderSettings === 'function') {
                this.saveTtsProviderSettings();
            }
        } catch (error) {
            console.error('Failed to upload reference audio:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Failed to upload reference audio: ' + error.message);
            }
        }
    }

    async onRefreshClick() {
        return this.checkReady();
    }

    //#################//
    //  TTS Interfaces //
    //#################//

    async getVoice(voiceName) {
        console.info('Fish Audio: Fetching voice', voiceName);
        return { name: "Seraphina", voice_id: "Seraphina", lang: 'zh-CN', preview_url: false };
    }

    async generateTts(text, voiceId) {
        // 過濾字串 text 中,匹配所有的 『 或 』 字串接取代為空白字串
        text = text.replace(/『|』/g, '');
        const response = await this.fetchTtsGeneration(text, voiceId);
        return response;
    }

    //###########//
    // API CALLS //
    //###########//
    async fetchTtsVoiceObjects() {
        console.info('Fish Audio: Fetching voice objects');
        return [{ name: 'Default', voice_id: 'default', lang: 'auto', preview_url: false }];
    }

    async fetchTtsGeneration(inputText, voiceId) {
        console.info('Fish Audio: Generating TTS for text:', inputText);

        // 準備請求資料，完全按照 cURL 格式
        const requestData = {
            "text": inputText,
            "chunk_length": this.settings.chunk_length,
            "format": this.settings.format,
            "mp3_bitrate": this.settings.mp3_bitrate,
            "references": [],
            "reference_id": this.settings.reference_id,
            "prosody": {
                "speed": 0.9,
                "volume": 0
            },
            "normalize": this.settings.normalize,
            "latency": this.settings.latency,
            "temperature": 0.7,
            "top_p": 0.7
        };

        console.log('Fish Audio: TTS Request data:', requestData);

        try {
            const response = await this.makeXHRRequest(requestData, true);

            console.log('Fish Audio: TTS Response status:', response.status);

            if (response.status === 401) {
                throw new Error('Unauthorized - Invalid API key');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fish Audio: TTS Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return response;
        } catch (error) {
            console.error('Fish Audio TTS generation failed:', error);
            throw error;
        }
    }

    async previewTtsVoice(voiceId) {
        try {
            const response = await this.fetchTtsGeneration('Hello, this is a preview.', voiceId);
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            this.audioElement.src = audioUrl;
            this.audioElement.play();
        } catch (error) {
            console.error('Preview failed:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Preview failed: ' + error.message);
            }
        }
    }

    // Interface not used by Fish Audio TTS
    async fetchTtsFromHistory(history_item_id) {
        return Promise.resolve('');
    }
}

export { FishAudioTtsProvider };