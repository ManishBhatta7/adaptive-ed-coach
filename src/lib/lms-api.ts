import { supabase } from './supabase';

export interface LMSConfig {
  type: 'canvas' | 'blackboard' | 'moodle' | 'google_classroom' | 'schoology';
  apiUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  courseId: string;
}

export interface LMSStudent {
  id: string;
  name: string;
  email: string;
  sis_user_id?: string;
}

export interface LMSAssignment {
  id: string;
  name: string;
  description?: string;
  points_possible: number;
  due_at?: string;
  published: boolean;
}

export interface LMSGrade {
  user_id: string;
  assignment_id: string;
  score: number;
  grade?: string;
  comment?: string;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  errors: string[];
  updated_at: string;
}

// Canvas LMS API integration
class CanvasAPI {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: LMSConfig) {
    this.apiUrl = config.apiUrl || '';
    this.apiKey = config.apiKey || '';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.apiUrl}/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/users/self');
      return true;
    } catch (error) {
      console.error('Canvas connection test failed:', error);
      return false;
    }
  }

  async getStudents(courseId: string): Promise<LMSStudent[]> {
    try {
      const students = await this.request(`/courses/${courseId}/students`);
      return students.map((student: any) => ({
        id: student.id.toString(),
        name: student.name,
        email: student.email,
        sis_user_id: student.sis_user_id,
      }));
    } catch (error) {
      console.error('Failed to fetch Canvas students:', error);
      return [];
    }
  }

  async getAssignments(courseId: string): Promise<LMSAssignment[]> {
    try {
      const assignments = await this.request(`/courses/${courseId}/assignments`);
      return assignments.map((assignment: any) => ({
        id: assignment.id.toString(),
        name: assignment.name,
        description: assignment.description,
        points_possible: assignment.points_possible,
        due_at: assignment.due_at,
        published: assignment.published,
      }));
    } catch (error) {
      console.error('Failed to fetch Canvas assignments:', error);
      return [];
    }
  }

  async createAssignment(courseId: string, assignment: Partial<LMSAssignment>): Promise<LMSAssignment | null> {
    try {
      const result = await this.request(`/courses/${courseId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          assignment: {
            name: assignment.name,
            description: assignment.description,
            points_possible: assignment.points_possible,
            due_at: assignment.due_at,
            published: assignment.published,
          },
        }),
      });

      return {
        id: result.id.toString(),
        name: result.name,
        description: result.description,
        points_possible: result.points_possible,
        due_at: result.due_at,
        published: result.published,
      };
    } catch (error) {
      console.error('Failed to create Canvas assignment:', error);
      return null;
    }
  }

  async submitGrade(courseId: string, assignmentId: string, grade: LMSGrade): Promise<boolean> {
    try {
      await this.request(`/courses/${courseId}/assignments/${assignmentId}/submissions/${grade.user_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          submission: {
            posted_grade: grade.score,
            comment: {
              text_comment: grade.comment,
            },
          },
        }),
      });
      return true;
    } catch (error) {
      console.error('Failed to submit grade to Canvas:', error);
      return false;
    }
  }
}

// Blackboard Learn API integration
class BlackboardAPI {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;

  constructor(config: LMSConfig) {
    this.apiUrl = config.apiUrl || '';
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.accessToken = config.accessToken;
  }

  private async authenticate(): Promise<void> {
    if (this.accessToken) return;

    const response = await fetch(`${this.apiUrl}/learn/api/public/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Blackboard authentication failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    await this.authenticate();

    const response = await fetch(`${this.apiUrl}/learn/api/public/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Blackboard API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      console.error('Blackboard connection test failed:', error);
      return false;
    }
  }

  async getStudents(courseId: string): Promise<LMSStudent[]> {
    try {
      const students = await this.request(`/courses/${courseId}/users`);
      return students.results?.map((student: any) => ({
        id: student.id,
        name: student.name?.given + ' ' + student.name?.family,
        email: student.contact?.email,
        sis_user_id: student.externalId,
      })) || [];
    } catch (error) {
      console.error('Failed to fetch Blackboard students:', error);
      return [];
    }
  }

  async submitGrade(courseId: string, assignmentId: string, grade: LMSGrade): Promise<boolean> {
    try {
      await this.request(`/courses/${courseId}/gradebook/columns/${assignmentId}/users/${grade.user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          score: grade.score,
          text: grade.comment,
        }),
      });
      return true;
    } catch (error) {
      console.error('Failed to submit grade to Blackboard:', error);
      return false;
    }
  }
}

// Moodle API integration
class MoodleAPI {
  private apiUrl: string;
  private token: string;

  constructor(config: LMSConfig) {
    this.apiUrl = config.apiUrl || '';
    this.token = config.apiKey || '';
  }

  private async request(wsfunction: string, params: Record<string, any> = {}) {
    const formData = new FormData();
    formData.append('wstoken', this.token);
    formData.append('wsfunction', wsfunction);
    formData.append('moodlewsrestformat', 'json');

    Object.keys(params).forEach(key => {
      formData.append(key, params[key]);
    });

    const response = await fetch(`${this.apiUrl}/webservice/rest/server.php`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Moodle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.exception) {
      throw new Error(`Moodle error: ${data.message}`);
    }

    return data;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('core_webservice_get_site_info');
      return true;
    } catch (error) {
      console.error('Moodle connection test failed:', error);
      return false;
    }
  }

  async getStudents(courseId: string): Promise<LMSStudent[]> {
    try {
      const students = await this.request('core_enrol_get_enrolled_users', {
        courseid: courseId,
      });

      return students.map((student: any) => ({
        id: student.id.toString(),
        name: student.fullname,
        email: student.email,
        sis_user_id: student.username,
      }));
    } catch (error) {
      console.error('Failed to fetch Moodle students:', error);
      return [];
    }
  }

  async submitGrade(courseId: string, assignmentId: string, grade: LMSGrade): Promise<boolean> {
    try {
      await this.request('mod_assign_save_grade', {
        assignmentid: assignmentId,
        userid: grade.user_id,
        grade: grade.score,
        plugindata: {
          assignfeedbackcomments_editor: {
            text: grade.comment || '',
            format: 1,
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to submit grade to Moodle:', error);
      return false;
    }
  }
}

// Google Classroom API integration
class GoogleClassroomAPI {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;

  constructor(config: LMSConfig) {
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.accessToken = config.accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Google Classroom API requires authentication');
    }

    const response = await fetch(`https://classroom.googleapis.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Classroom API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/courses');
      return true;
    } catch (error) {
      console.error('Google Classroom connection test failed:', error);
      return false;
    }
  }

  async getStudents(courseId: string): Promise<LMSStudent[]> {
    try {
      const students = await this.request(`/courses/${courseId}/students`);
      return students.students?.map((student: any) => ({
        id: student.userId,
        name: student.profile.name.fullName,
        email: student.profile.emailAddress,
        sis_user_id: student.profile.id,
      })) || [];
    } catch (error) {
      console.error('Failed to fetch Google Classroom students:', error);
      return [];
    }
  }

  async submitGrade(courseId: string, assignmentId: string, grade: LMSGrade): Promise<boolean> {
    try {
      await this.request(`/courses/${courseId}/courseWork/${assignmentId}/studentSubmissions/${grade.user_id}:modifyAttachments`, {
        method: 'POST',
        body: JSON.stringify({
          assignedGrade: grade.score,
          draftGrade: grade.score,
        }),
      });
      return true;
    } catch (error) {
      console.error('Failed to submit grade to Google Classroom:', error);
      return false;
    }
  }
}

// Schoology API integration
class SchoologyAPI {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;

  constructor(config: LMSConfig) {
    this.apiUrl = config.apiUrl || '';
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret || '';
    this.accessToken = config.accessToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.apiUrl}/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `OAuth realm="Schoology API",oauth_consumer_key="${this.clientId}"`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Schoology API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/users/me');
      return true;
    } catch (error) {
      console.error('Schoology connection test failed:', error);
      return false;
    }
  }

  async getStudents(courseId: string): Promise<LMSStudent[]> {
    try {
      const students = await this.request(`/sections/${courseId}/enrollments`);
      return students.enrollment?.map((enrollment: any) => ({
        id: enrollment.uid.toString(),
        name: `${enrollment.name_first} ${enrollment.name_last}`,
        email: enrollment.primary_email,
        sis_user_id: enrollment.school_uid,
      })) || [];
    } catch (error) {
      console.error('Failed to fetch Schoology students:', error);
      return [];
    }
  }

  async submitGrade(courseId: string, assignmentId: string, grade: LMSGrade): Promise<boolean> {
    try {
      await this.request(`/sections/${courseId}/submissions/${grade.user_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          grade: grade.score,
          comment: grade.comment,
        }),
      });
      return true;
    } catch (error) {
      console.error('Failed to submit grade to Schoology:', error);
      return false;
    }
  }
}

// Factory function to create API instances
export function createLMSAPI(config: LMSConfig) {
  switch (config.type) {
    case 'canvas':
      return new CanvasAPI(config);
    case 'blackboard':
      return new BlackboardAPI(config);
    case 'moodle':
      return new MoodleAPI(config);
    case 'google_classroom':
      return new GoogleClassroomAPI(config);
    case 'schoology':
      return new SchoologyAPI(config);
    default:
      throw new Error(`Unsupported LMS type: ${config.type}`);
  }
}

// High-level LMS service functions
export class LMSService {
  static async testConnection(config: LMSConfig): Promise<boolean> {
    try {
      const api = createLMSAPI(config);
      return await api.testConnection();
    } catch (error) {
      console.error('LMS connection test failed:', error);
      return false;
    }
  }

  static async syncGrades(integrationId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      synced_count: 0,
      errors: [],
      updated_at: new Date().toISOString(),
    };

    try {
      // Get integration config from database
      const { data: integration, error: integrationError } = await supabase
        .from('lms_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        result.errors.push('Integration not found');
        return result;
      }

      // Create API instance
      const config: LMSConfig = {
        type: integration.lms_type,
        ...integration.connection_config,
        courseId: integration.lms_course_id,
      };

      const api = createLMSAPI(config);

      // Test connection
      const isConnected = await api.testConnection();
      if (!isConnected) {
        result.errors.push('Failed to connect to LMS');
        return result;
      }

      // Get students from classroom and LMS
      const { data: classroomStudents, error: studentsError } = await supabase
        .from('classroom_students')
        .select(`
          student_id,
          profiles:student_id (
            id,
            name,
            email
          )
        `)
        .eq('classroom_id', integration.classroom_id);

      if (studentsError || !classroomStudents) {
        result.errors.push('Failed to fetch classroom students');
        return result;
      }

      // Get recent metacognitive scores that need syncing
      const { data: assessmentResults, error: resultsError } = await supabase
        .from('assessment_results')
        .select('*')
        .in('student_id', classroomStudents.map(s => s.student_id))
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (resultsError) {
        result.errors.push('Failed to fetch assessment results');
        return result;
      }

      // Group results by student and calculate average metacognitive score
      const studentScores = new Map<string, { score: number; count: number }>();
      
      assessmentResults?.forEach(result => {
        if (!result.metacognitive_score) return;
        
        const current = studentScores.get(result.student_id) || { score: 0, count: 0 };
        current.score += result.metacognitive_score;
        current.count += 1;
        studentScores.set(result.student_id, current);
      });

      // Sync grades for each student
      let syncCount = 0;
      const assignmentId = 'metacog-assessment'; // Default assignment ID

      for (const [studentId, scoreData] of studentScores.entries()) {
        try {
          const averageScore = scoreData.score / scoreData.count;
          const lmsGrade = Math.round(averageScore * 100); // Convert to percentage

          // Find corresponding student in our system
          const student = classroomStudents.find(s => s.student_id === studentId);
          if (!student) continue;

          const grade: LMSGrade = {
            user_id: studentId,
            assignment_id: assignmentId,
            score: lmsGrade,
            comment: `Metacognitive Learning Assessment - Average score based on ${scoreData.count} recent assessments`,
          };

          // Submit grade to LMS
          const gradeSubmitted = await api.submitGrade(config.courseId, assignmentId, grade);

          if (gradeSubmitted) {
            // Record sync in database
            await supabase
              .from('lms_grade_sync')
              .insert({
                integration_id: integrationId,
                student_id: studentId,
                assignment_type: 'metacognitive_assessment',
                assignment_id: assignmentId,
                metacog_score: averageScore,
                lms_grade: lmsGrade,
                sync_status: 'synced',
                synced_at: new Date().toISOString(),
              });

            syncCount++;
          } else {
            result.errors.push(`Failed to sync grade for student ${studentId}`);
          }
        } catch (error) {
          result.errors.push(`Error syncing grade for student ${studentId}: ${error}`);
        }
      }

      // Update integration last_sync_at
      await supabase
        .from('lms_integrations')
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_status: result.errors.length > 0 ? 'error' : 'connected'
        })
        .eq('id', integrationId);

      result.success = syncCount > 0;
      result.synced_count = syncCount;

    } catch (error) {
      console.error('Grade sync failed:', error);
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  static async importStudents(integrationId: string): Promise<{ imported: number; errors: string[] }> {
    const result = { imported: 0, errors: [] };

    try {
      // Get integration config
      const { data: integration, error } = await supabase
        .from('lms_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        result.errors.push('Integration not found');
        return result;
      }

      const config: LMSConfig = {
        type: integration.lms_type,
        ...integration.connection_config,
        courseId: integration.lms_course_id,
      };

      const api = createLMSAPI(config);
      const students = await api.getStudents(config.courseId);

      for (const student of students) {
        try {
          // Check if student already exists
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', student.email)
            .single();

          if (!existingUser) {
            // Create new user profile
            const { data: newUser, error: createError } = await supabase
              .from('profiles')
              .insert({
                name: student.name,
                email: student.email,
                role: 'student',
              })
              .select()
              .single();

            if (createError) {
              result.errors.push(`Failed to create user ${student.name}: ${createError.message}`);
              continue;
            }

            // Add to classroom
            const { error: enrollError } = await supabase
              .from('classroom_students')
              .insert({
                classroom_id: integration.classroom_id,
                student_id: newUser.id,
                enrolled_at: new Date().toISOString(),
              });

            if (enrollError) {
              result.errors.push(`Failed to enroll ${student.name}: ${enrollError.message}`);
              continue;
            }

            result.imported++;
          }
        } catch (error) {
          result.errors.push(`Error importing student ${student.name}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Student import failed: ${error}`);
    }

    return result;
  }
}

export default LMSService;