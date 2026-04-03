// ============================================
// CLIENT PORTAL ROUTES
// These routes allow clients to sign up, login and view their own data
// ============================================

export function addClientPortalRoutes(app: any, supabaseAdmin: any, kv: any, logAudit: any, generateId: any) {
  
  // Client Portal Signup - Creates both auth user and client record
  app.post("/make-server-bd42bc02/client-portal/signup", async (c: any) => {
    try {
      const body = await c.req.json();
      const { email, password, clientData } = body;

      if (!email || !password || !clientData) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      // Validation
      if (!clientData.fullName || !clientData.cpfCnpj || !clientData.rg || 
          !clientData.phone || !clientData.lgpdConsent) {
        return c.json({ error: 'Missing required client data' }, 400);
      }

      // Create auth user with role 'client'
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { 
          name: clientData.fullName,
          role: 'client' 
        },
        email_confirm: true // Auto-confirm
      });

      if (authError) {
        console.error('[CLIENT_PORTAL_SIGNUP] Error creating auth user:', authError);
        return c.json({ error: authError.message }, 400);
      }

      const userId = authData.user.id;

      // Create user profile with role 'client'
      const userProfile = {
        id: userId,
        email,
        name: clientData.fullName,
        role: 'client',
        createdAt: new Date().toISOString(),
      };

      await kv.set(`user_profile:${userId}`, JSON.stringify(userProfile));

      // Create client record
      const clientId = generateId('client');
      const client = {
        id: clientId,
        authUserId: userId, // Link to auth user
        fullName: clientData.fullName,
        cpfCnpj: clientData.cpfCnpj,
        rg: clientData.rg,
        birthDate: clientData.birthDate,
        phone: clientData.phone,
        whatsapp: clientData.whatsapp || clientData.phone,
        email,
        address: clientData.address,
        occupation: clientData.occupation,
        company: clientData.company,
        monthlyIncome: clientData.monthlyIncome,
        status: 'active',
        lgpdConsent: clientData.lgpdConsent,
        lgpdConsentDate: new Date().toISOString(),
        documents: {
          front: null,
          back: null,
          selfie: null,
          video: null,
        },
        createdAt: new Date().toISOString(),
        createdBy: userId,
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`client:${clientId}`, JSON.stringify(client));
      await kv.set(`client_cpf:${clientData.cpfCnpj}`, clientId);
      await kv.set(`client_auth:${userId}`, clientId); // Map auth user to client

      await logAudit({
        userId,
        action: 'CLIENT_PORTAL_SIGNUP',
        resource: `client:${clientId}`,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        metadata: { clientName: clientData.fullName, email }
      });

      return c.json({ 
        success: true, 
        message: 'Account created successfully',
        clientId 
      });
    } catch (error) {
      console.error('[CLIENT_PORTAL_SIGNUP] Error:', error);
      return c.json({ error: 'Error creating client account', details: String(error) }, 500);
    }
  });

  // Get client's own data (requires authentication as client)
  app.get("/make-server-bd42bc02/client-portal/my-data", async (c: any) => {
    try {
      console.log('[CLIENT_PORTAL_MY_DATA] ===== START =====');
      
      const authHeader = c.req.header('Authorization');
      const userTokenHeader = c.req.header('X-User-Token');
      
      console.log('[CLIENT_PORTAL_MY_DATA] Has Authorization:', !!authHeader);
      console.log('[CLIENT_PORTAL_MY_DATA] Has X-User-Token:', !!userTokenHeader);
      
      // Use X-User-Token if available, otherwise Authorization
      let token = null;
      if (userTokenHeader) {
        token = userTokenHeader.trim();
        console.log('[CLIENT_PORTAL_MY_DATA] Using X-User-Token');
      } else if (authHeader) {
        token = authHeader.replace('Bearer ', '').trim();
        console.log('[CLIENT_PORTAL_MY_DATA] Using Authorization header');
      }
      
      if (!token) {
        console.error('[CLIENT_PORTAL_MY_DATA] No authentication token provided');
        return c.json({ error: 'Unauthorized' }, 401);
      }

      console.log('[CLIENT_PORTAL_MY_DATA] Token length:', token.length);
      console.log('[CLIENT_PORTAL_MY_DATA] Verifying user with Supabase...');
      
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !authUser) {
        console.error('[CLIENT_PORTAL_MY_DATA] Auth error:', authError?.message || 'No user returned');
        return c.json({ error: 'Unauthorized' }, 401);
      }

      console.log('[CLIENT_PORTAL_MY_DATA] ✅ User verified:', authUser.email, 'ID:', authUser.id);

      // Get or create user profile
      let profileData = await kv.get(`user_profile:${authUser.id}`);
      
      if (!profileData) {
        console.log('[CLIENT_PORTAL_MY_DATA] Profile not found, creating automatically...');
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Cliente',
          role: authUser.user_metadata?.role || 'client',
          createdAt: new Date().toISOString(),
        };
        await kv.set(`user_profile:${authUser.id}`, JSON.stringify(newProfile));
        profileData = JSON.stringify(newProfile);
        console.log('[CLIENT_PORTAL_MY_DATA] Profile created with role:', newProfile.role);
      }
      
      const profile = JSON.parse(profileData);
      console.log('[CLIENT_PORTAL_MY_DATA] Profile loaded:', { role: profile.role, name: profile.name });

      // Verify role is client
      if (profile.role !== 'client') {
        return c.json({ error: 'Forbidden: Not a client account' }, 403);
      }

      // Get client data
      let clientId = await kv.get(`client_auth:${authUser.id}`);
      
      // Auto-create client record if it doesn't exist (recovery mechanism)
      if (!clientId) {
        console.log('[CLIENT_PORTAL] Client record not found, creating automatically for user:', authUser.id);
        const newClientId = generateId('client');
        const newClient = {
          id: newClientId,
          authUserId: authUser.id,
          fullName: profile.name || authUser.email?.split('@')[0] || 'Cliente',
          cpfCnpj: '',
          rg: '',
          birthDate: '',
          phone: '',
          whatsapp: '',
          email: authUser.email || profile.email,
          address: '',
          occupation: '',
          company: '',
          monthlyIncome: 0,
          status: 'active',
          lgpdConsent: true,
          lgpdConsentDate: new Date().toISOString(),
          documents: { front: null, back: null, selfie: null, video: null },
          createdAt: new Date().toISOString(),
          createdBy: authUser.id,
          updatedAt: new Date().toISOString(),
        };

        await kv.set(`client:${newClientId}`, JSON.stringify(newClient));
        await kv.set(`client_auth:${authUser.id}`, newClientId);
        clientId = newClientId;
        
        console.log('[CLIENT_PORTAL] Auto-created client record:', newClientId);
      }

      const clientData = await kv.get(`client:${clientId}`);
      if (!clientData) {
        console.error('[CLIENT_PORTAL] Client data corruption - ID exists but data missing:', clientId);
        return c.json({ error: 'Client data not found. Please contact support.' }, 404);
      }

      const client = JSON.parse(clientData);

      // Generate signed URLs for documents
      if (client.documents) {
        for (const [type, doc] of Object.entries(client.documents)) {
          if (doc && doc.path) {
            try {
              const { data: signedUrlData, error } = await supabaseAdmin.storage
                .from('make-bd42bc02-documents')
                .createSignedUrl(doc.path, 3600);
              
              if (!error && signedUrlData?.signedUrl) {
                client.documents[type] = signedUrlData.signedUrl;
              } else {
                client.documents[type] = null;
              }
            } catch (error) {
              console.error(`[CLIENT_PORTAL] Error processing document ${type}:`, error);
              client.documents[type] = null;
            }
          }
        }
      }

      // Get client's contracts
      const contracts = [];
      if (client.contractIds && client.contractIds.length > 0) {
        for (const contractId of client.contractIds) {
          const contractData = await kv.get(`contract:${contractId}`);
          if (contractData) {
            contracts.push(JSON.parse(contractData));
          }
        }
      }

      return c.json({ client, contracts });
    } catch (error) {
      console.error('[CLIENT_PORTAL_MY_DATA] Error:', error);
      return c.json({ error: 'Error fetching client data' }, 500);
    }
  });

  // Upload document (client can only upload to their own account)
  app.post("/make-server-bd42bc02/client-portal/upload-document", async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization');
      const userTokenHeader = c.req.header('X-User-Token');
      
      // Use X-User-Token if available, otherwise Authorization
      let token = null;
      if (userTokenHeader) {
        token = userTokenHeader.trim();
      } else if (authHeader) {
        token = authHeader.replace('Bearer ', '').trim();
      }
      
      if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !authUser) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Verify role is client
      const profileData = await kv.get(`user_profile:${authUser.id}`);
      if (!profileData) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      const profile = JSON.parse(profileData);
      if (profile.role !== 'client') {
        return c.json({ error: 'Forbidden: Not a client account' }, 403);
      }

      // Get client ID
      const clientId = await kv.get(`client_auth:${authUser.id}`);
      if (!clientId) {
        return c.json({ error: 'Client data not found' }, 404);
      }

      const body = await c.req.json();
      const { documentType, fileName, fileData, mimeType } = body;

      if (!['front', 'back', 'selfie', 'video'].includes(documentType)) {
        return c.json({ error: 'Invalid document type' }, 400);
      }

      // Validate file size (50MB max)
      const fileSizeBytes = (fileData.length * 3) / 4;
      if (fileSizeBytes > 52428800) {
        return c.json({ error: 'File size exceeds 50MB limit' }, 400);
      }

      const clientData = await kv.get(`client:${clientId}`);
      if (!clientData) {
        return c.json({ error: 'Client not found' }, 404);
      }

      // Convert base64 to blob
      const base64Data = fileData.split(',')[1] || fileData;
      const binaryData = Uint8Array.from(atob(base64Data), (c: string) => c.charCodeAt(0));

      const filePath = `${clientId}/${documentType}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('make-bd42bc02-documents')
        .upload(filePath, binaryData, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error('[CLIENT_PORTAL_UPLOAD] Error uploading file:', uploadError);
        return c.json({ error: uploadError.message }, 500);
      }

      // Update client document reference
      const client = JSON.parse(clientData);
      client.documents[documentType] = {
        path: filePath,
        fileName,
        mimeType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: authUser.id,
      };
      client.updatedAt = new Date().toISOString();

      await kv.set(`client:${clientId}`, JSON.stringify(client));

      await logAudit({
        userId: authUser.id,
        action: 'CLIENT_PORTAL_DOCUMENT_UPLOADED',
        resource: `client:${clientId}`,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        metadata: { documentType, fileName }
      });

      // Generate signed URL
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from('make-bd42bc02-documents')
        .createSignedUrl(filePath, 3600);

      return c.json({ 
        success: true, 
        url: signedUrlData?.signedUrl,
        document: client.documents[documentType]
      });
    } catch (error) {
      console.error('[CLIENT_PORTAL_UPLOAD] Error:', error);
      return c.json({ error: 'Error uploading document' }, 500);
    }
  });

  // Complete registration (first access)
  app.post("/make-server-bd42bc02/client-portal/complete-registration", async (c: any) => {
    try {
      console.log('[CLIENT_PORTAL_COMPLETE_REG] ===== START =====');
      
      const authHeader = c.req.header('Authorization');
      const userTokenHeader = c.req.header('X-User-Token');
      
      // Use X-User-Token if available, otherwise Authorization
      let token = null;
      if (userTokenHeader) {
        token = userTokenHeader.trim();
      } else if (authHeader) {
        token = authHeader.replace('Bearer ', '').trim();
      }
      
      if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !authUser) {
        console.error('[CLIENT_PORTAL_COMPLETE_REG] Auth error:', authError);
        return c.json({ error: 'Unauthorized' }, 401);
      }

      console.log('[CLIENT_PORTAL_COMPLETE_REG] User:', authUser.email, 'ID:', authUser.id);

      // Verify role is client
      const profileData = await kv.get(`user_profile:${authUser.id}`);
      if (!profileData) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      const profile = JSON.parse(profileData);
      if (profile.role !== 'client') {
        return c.json({ error: 'Forbidden: Not a client account' }, 403);
      }

      // Get client ID
      const clientId = await kv.get(`client_auth:${authUser.id}`);
      if (!clientId) {
        return c.json({ error: 'Client data not found' }, 404);
      }

      // Parse FormData instead of JSON
      const formData = await c.req.formData();
      console.log('[CLIENT_PORTAL_COMPLETE_REG] FormData received');

      // Debug: Log all FormData keys
      const allKeys = Array.from(formData.keys());
      console.log('[CLIENT_PORTAL_COMPLETE_REG] All FormData keys:', allKeys);
      console.log('[CLIENT_PORTAL_COMPLETE_REG] Total entries:', allKeys.length);

      // Extract text fields
      const fullName = formData.get('fullName');
      const cpfCnpj = formData.get('cpfCnpj');
      const rg = formData.get('rg');
      const birthDate = formData.get('birthDate');
      const phone = formData.get('phone');
      const whatsapp = formData.get('whatsapp');
      const email = formData.get('email');
      const address = formData.get('address');
      const occupation = formData.get('occupation');
      const company = formData.get('company');
      const monthlyIncome = formData.get('monthlyIncome');
      const lgpdConsent = formData.get('lgpdConsent') === 'true';

      // Extract document files
      const profilePhoto = formData.get('profilePhoto');
      const documentPhoto1 = formData.get('documentPhoto1');
      const documentPhoto2 = formData.get('documentPhoto2');
      const documentPhoto3 = formData.get('documentPhoto3');
      const documentPhoto4 = formData.get('documentPhoto4');
      const documentPhoto5 = formData.get('documentPhoto5'); // Optional
      const documentPhoto6 = formData.get('documentPhoto6'); // Optional
      const documentVideo1 = formData.get('documentVideo1');
      const documentVideo2 = formData.get('documentVideo2'); // Optional

      console.log('[CLIENT_PORTAL_COMPLETE_REG] Files received:', {
        profilePhoto: profilePhoto ? `${profilePhoto.name} (${(profilePhoto.size / 1024 / 1024).toFixed(2)}MB)` : 'none',
        documentPhoto1: documentPhoto1 ? `${documentPhoto1.name} (${(documentPhoto1.size / 1024 / 1024).toFixed(2)}MB)` : 'none',
        documentPhoto2: documentPhoto2 ? `${documentPhoto2.name} (${(documentPhoto2.size / 1024 / 1024).toFixed(2)}MB)` : 'none',
        documentPhoto3: documentPhoto3 ? `${documentPhoto3.name} (${(documentPhoto3.size / 1024 / 1024).toFixed(2)}MB)` : 'none',
        documentPhoto4: documentPhoto4 ? `${documentPhoto4.name} (${(documentPhoto4.size / 1024 / 1024).toFixed(2)}MB)` : 'none',
        documentPhoto5: documentPhoto5 ? `${documentPhoto5.name} (${(documentPhoto5.size / 1024 / 1024).toFixed(2)}MB)` : 'none (optional)',
        documentPhoto6: documentPhoto6 ? `${documentPhoto6.name} (${(documentPhoto6.size / 1024 / 1024).toFixed(2)}MB)` : 'none (optional)',
        documentVideo1: documentVideo1 ? `${documentVideo1.name} (${(documentVideo1.size / 1024 / 1024).toFixed(2)}MB)` : 'none',
        documentVideo2: documentVideo2 ? `${documentVideo2.name} (${(documentVideo2.size / 1024 / 1024).toFixed(2)}MB)` : 'none (optional)',
      });

      // Debug: Check types
      console.log('[CLIENT_PORTAL_COMPLETE_REG] File types check:', {
        profilePhoto: profilePhoto instanceof File,
        documentPhoto1: documentPhoto1 instanceof File,
        documentPhoto2: documentPhoto2 instanceof File,
        documentPhoto3: documentPhoto3 instanceof File,
        documentPhoto4: documentPhoto4 instanceof File,
        documentPhoto5: documentPhoto5 instanceof File,
        documentPhoto6: documentPhoto6 instanceof File,
        documentVideo1: documentVideo1 instanceof File,
        documentVideo2: documentVideo2 instanceof File,
      });

      // Validation - all fields are required
      if (!fullName || !cpfCnpj || !rg || !birthDate || !phone || 
          !email || !address || !occupation || !company || !monthlyIncome || !lgpdConsent) {
        return c.json({ error: 'Todos os campos obrigatórios devem ser preenchidos' }, 400);
      }

      // Validation - profile photo + 4 document photos + 1 video are required (photo5, photo6, video2 are optional)
      if (!profilePhoto || !documentPhoto1 || !documentPhoto2 || !documentPhoto3 || !documentPhoto4 || !documentVideo1) {
        const missingDocs = [];
        if (!profilePhoto) missingDocs.push('profilePhoto');
        if (!documentPhoto1) missingDocs.push('documentPhoto1');
        if (!documentPhoto2) missingDocs.push('documentPhoto2');
        if (!documentPhoto3) missingDocs.push('documentPhoto3');
        if (!documentPhoto4) missingDocs.push('documentPhoto4');
        if (!documentVideo1) missingDocs.push('documentVideo1');

        console.error('[CLIENT_PORTAL_COMPLETE_REG] Missing required documents:', missingDocs);

        return c.json({
          error: 'Foto de perfil, 4 fotos de documentos e 1 vídeo são obrigatórios',
          missing: missingDocs,
        }, 400);
      }

      const clientData = await kv.get(`client:${clientId}`);
      if (!clientData) {
        return c.json({ error: 'Client not found' }, 404);
      }

      const client = JSON.parse(clientData);

      // Check if already completed (prevent re-editing)
      const isAlreadyComplete = (
        client.fullName && client.fullName !== '' &&
        client.cpfCnpj && client.cpfCnpj !== '' &&
        client.rg && client.rg !== '' &&
        client.birthDate && client.birthDate !== '' &&
        client.phone && client.phone !== '' &&
        client.address && client.address !== '' &&
        client.occupation && client.occupation !== '' &&
        client.company && client.company !== '' &&
        client.monthlyIncome && client.monthlyIncome !== '' && client.monthlyIncome !== 0
      );

      if (isAlreadyComplete) {
        console.log('[CLIENT_PORTAL_COMPLETE_REG] Registration already completed');
        return c.json({ error: 'Cadastro já foi concluído. Entre em contato com a administração para alterações.' }, 400);
      }

      // Ensure bucket exists
      const bucketName = 'make-bd42bc02-documents';
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((bucket: any) => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log('[CLIENT_PORTAL_COMPLETE_REG] Creating bucket:', bucketName);
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });
        
        if (bucketError) {
          console.error('[CLIENT_PORTAL_COMPLETE_REG] Error creating bucket:', bucketError);
          return c.json({ error: 'Erro ao criar bucket de armazenamento' }, 500);
        }
      }

      // Upload documents to Supabase Storage
      const documentUrls: any = {
        profilePhoto: null,
        foto1: null,  // Changed from photo1
        foto2: null,  // Changed from photo2
        foto3: null,  // Changed from photo3
        foto4: null,  // Changed from photo4
        foto5: null,  // Changed from photo5 (Optional)
        foto6: null,  // Changed from photo6 (Optional)
        video1: null,
        video2: null, // Optional
      };

      const documentsToUpload = [
        { key: 'profilePhoto', file: profilePhoto, type: 'profile' },
        { key: 'foto1', file: documentPhoto1, type: 'foto1' },      // Changed key
        { key: 'foto2', file: documentPhoto2, type: 'foto2' },      // Changed key
        { key: 'foto3', file: documentPhoto3, type: 'foto3' },      // Changed key
        { key: 'foto4', file: documentPhoto4, type: 'foto4' },      // Changed key
        { key: 'foto5', file: documentPhoto5, type: 'foto5' },      // Changed key (Optional)
        { key: 'foto6', file: documentPhoto6, type: 'foto6' },      // Changed key (Optional)
        { key: 'video1', file: documentVideo1, type: 'video1' },
        { key: 'video2', file: documentVideo2, type: 'video2' },    // Optional
      ];

      for (const { key, file, type } of documentsToUpload) {
        if (file) {
          try {
            console.log(`[CLIENT_PORTAL_COMPLETE_REG] Uploading ${key}:`, file.name);
            
            // Convert File to ArrayBuffer then Uint8Array
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Simplified path structure: clientId/filename.ext
            // Use type as the base filename to maintain consistency
            const fileExtension = file.name.split('.').pop();
            const fileName = type === 'profile' ? `profile.${fileExtension}` : `${type}.${fileExtension}`;
            const filePath = `${clientId}/${fileName}`;
            const contentType = file.type || 'application/octet-stream';
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from(bucketName)
              .upload(filePath, uint8Array, {
                contentType,
                upsert: true,
              });

            if (uploadError) {
              console.error(`[CLIENT_PORTAL_COMPLETE_REG] Error uploading ${key}:`, uploadError);
              return c.json({ error: `Erro ao fazer upload do documento: ${key}` }, 500);
            }

            console.log(`[CLIENT_PORTAL_COMPLETE_REG] ✅ ${key} uploaded:`, filePath);

            // Save document metadata
            documentUrls[key] = {
              path: filePath,
              fileName: file.name,
              mimeType: contentType,
              uploadedAt: new Date().toISOString(),
              uploadedBy: authUser.id,
            };
          } catch (error) {
            console.error(`[CLIENT_PORTAL_COMPLETE_REG] Error processing ${key}:`, error);
            return c.json({ error: `Erro ao processar documento: ${key}` }, 500);
          }
        }
      }

      // Update client data
      client.fullName = fullName;
      client.cpfCnpj = cpfCnpj;
      client.rg = rg;
      client.birthDate = birthDate;
      client.phone = phone;
      client.whatsapp = whatsapp || phone;
      client.email = email;
      client.address = address;
      client.occupation = occupation;
      client.company = company;
      client.monthlyIncome = monthlyIncome;
      client.lgpdConsent = lgpdConsent;
      client.lgpdConsentDate = new Date().toISOString();
      client.updatedAt = new Date().toISOString();
      client.profileCompletedAt = new Date().toISOString();
      client.documents = documentUrls; // Save document metadata

      console.log('[CLIENT_PORTAL_COMPLETE_REG] Saving client with documents:', {
        profilePhoto: !!documentUrls.profilePhoto,
        foto1: !!documentUrls.foto1,  // Changed from photo1
        foto2: !!documentUrls.foto2,  // Changed from photo2
        foto3: !!documentUrls.foto3,  // Changed from photo3
        foto4: !!documentUrls.foto4,  // Changed from photo4
        foto5: !!documentUrls.foto5,  // Changed from photo5
        foto6: !!documentUrls.foto6,  // Changed from photo6
        video1: !!documentUrls.video1,
        video2: !!documentUrls.video2,
      });

      await kv.set(`client:${clientId}`, JSON.stringify(client));

      // Update CPF index if it changed
      if (cpfCnpj) {
        await kv.set(`client_cpf:${cpfCnpj}`, clientId);
      }

      await logAudit({
        userId: authUser.id,
        action: 'CLIENT_PORTAL_COMPLETE_REGISTRATION',
        resource: `client:${clientId}`,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        metadata: { clientName: fullName, email, documentsUploaded: true }
      });

      console.log('[CLIENT_PORTAL_COMPLETE_REG] Registration completed successfully with documents');

      return c.json({ 
        success: true, 
        message: 'Cadastro concluído com sucesso',
        client 
      });
    } catch (error) {
      console.error('[CLIENT_PORTAL_COMPLETE_REG] Error:', error);
      return c.json({ error: 'Error completing registration', details: String(error) }, 500);
    }
  });

  // Delete account (only if no pending debts)
  app.post("/make-server-bd42bc02/client-portal/delete-account", async (c: any) => {
    try {
      console.log('[CLIENT_PORTAL_DELETE_ACCOUNT] ===== START =====');
      
      const authHeader = c.req.header('Authorization');
      const userTokenHeader = c.req.header('X-User-Token');
      
      // Use X-User-Token if available, otherwise Authorization
      let token = null;
      if (userTokenHeader) {
        token = userTokenHeader.trim();
      } else if (authHeader) {
        token = authHeader.replace('Bearer ', '').trim();
      }
      
      if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !authUser) {
        console.error('[CLIENT_PORTAL_DELETE_ACCOUNT] Auth error:', authError);
        return c.json({ error: 'Unauthorized' }, 401);
      }

      console.log('[CLIENT_PORTAL_DELETE_ACCOUNT] User:', authUser.email, 'ID:', authUser.id);

      // Verify role is client
      const profileData = await kv.get(`user_profile:${authUser.id}`);
      if (!profileData) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      const profile = JSON.parse(profileData);
      if (profile.role !== 'client') {
        return c.json({ error: 'Forbidden: Not a client account' }, 403);
      }

      // Get client ID
      const clientId = await kv.get(`client_auth:${authUser.id}`);
      if (!clientId) {
        return c.json({ error: 'Client data not found' }, 404);
      }

      const clientData = await kv.get(`client:${clientId}`);
      if (!clientData) {
        return c.json({ error: 'Client not found' }, 404);
      }

      const client = JSON.parse(clientData);

      // Check if client has pending debts
      if (client.contractIds && client.contractIds.length > 0) {
        for (const contractId of client.contractIds) {
          const contractData = await kv.get(`contract:${contractId}`);
          if (contractData) {
            const contract = JSON.parse(contractData);
            
            // Check if contract is active and has unpaid installments
            if (contract.status === 'active' && contract.installmentsList) {
              for (const installment of contract.installmentsList) {
                if (installment.status !== 'paid') {
                  console.log('[CLIENT_PORTAL_DELETE_ACCOUNT] Client has unpaid installments');
                  return c.json({ 
                    error: 'Não é possível excluir a conta. Você possui parcelas pendentes ou em atraso.' 
                  }, 400);
                }
              }
            }
          }
        }
      }

      // Mark client as deleted (soft delete for audit purposes)
      client.status = 'deleted';
      client.deletedAt = new Date().toISOString();
      client.deletedBy = authUser.id;
      
      // Anonymize personal data for LGPD compliance
      const originalCpf = client.cpfCnpj;
      client.fullName = '[EXCLUÍDO]';
      client.cpfCnpj = '[EXCLUÍDO]';
      client.rg = '[EXCLUÍDO]';
      client.phone = '[EXCLUÍDO]';
      client.whatsapp = '[EXCLUÍDO]';
      client.email = '[EXCLUÍDO]';
      client.address = '[EXCLUÍDO]';
      client.occupation = '[EXCLUÍDO]';
      client.company = '[EXCLUÍDO]';
      client.monthlyIncome = 0;
      client.birthDate = null;

      await kv.set(`client:${clientId}`, JSON.stringify(client));

      // Delete CPF index
      if (originalCpf && originalCpf !== '[EXCLUÍDO]') {
        await kv.del(`client_cpf:${originalCpf}`);
      }

      // Delete client_auth mapping
      await kv.del(`client_auth:${authUser.id}`);

      // Delete user profile
      await kv.del(`user_profile:${authUser.id}`);

      // Delete documents from storage
      if (client.documents) {
        for (const [type, doc] of Object.entries(client.documents)) {
          if (doc && doc.path) {
            try {
              await supabaseAdmin.storage
                .from('make-bd42bc02-documents')
                .remove([doc.path]);
              console.log(`[CLIENT_PORTAL_DELETE_ACCOUNT] Deleted document: ${type}`);
            } catch (error) {
              console.error(`[CLIENT_PORTAL_DELETE_ACCOUNT] Error deleting document ${type}:`, error);
            }
          }
        }
      }

      // Try to delete auth user - don't fail if user doesn't exist
      try {
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        if (deleteAuthError) {
          // User might already be deleted or not found - this is OK
          if (deleteAuthError.message?.includes('not found') || deleteAuthError.status === 404) {
            console.log('[CLIENT_PORTAL_DELETE_ACCOUNT] Auth user already deleted or not found - continuing');
          } else {
            console.error('[CLIENT_PORTAL_DELETE_ACCOUNT] Error deleting auth user:', deleteAuthError);
          }
        } else {
          console.log('[CLIENT_PORTAL_DELETE_ACCOUNT] Auth user deleted successfully');
        }
      } catch (error) {
        console.error('[CLIENT_PORTAL_DELETE_ACCOUNT] Exception deleting auth user:', error);
        // Continue anyway - the important data has been anonymized
      }

      await logAudit({
        userId: authUser.id,
        action: 'CLIENT_PORTAL_DELETE_ACCOUNT',
        resource: `client:${clientId}`,
        ip: c.req.header('x-forwarded-for') || 'unknown',
        metadata: { 
          clientId,
          email: authUser.email,
          reason: 'Client requested account deletion'
        }
      });

      console.log('[CLIENT_PORTAL_DELETE_ACCOUNT] Account deleted successfully');

      return c.json({ 
        success: true, 
        message: 'Conta excluída com sucesso' 
      });
    } catch (error) {
      console.error('[CLIENT_PORTAL_DELETE_ACCOUNT] Error:', error);
      return c.json({ error: 'Error deleting account', details: String(error) }, 500);
    }
  });
}